import {GeomElement} from "./elements/GeomElement";
import {PlaneElement} from "./elements/plane/PlaneElement";
import {FixedPoint} from "./elements/point/FixedPoint";
import {AllConstructions, Construction, SortedParams, constructions, getConstructionName} from "./elements/Constructions";
import {PointElement} from "./elements/point/PointElement";
import {Canvas} from "canvas";
import {LineElement} from "./elements/line/LineElement";

export type SlateCanvas = HTMLCanvasElement | Canvas;

export class Slate {

    protected _elements : GeomElement[];
    // Name aliases — secondary names that resolve to existing elements
    // without adding new ones to _elements. The original Geometry Applet
    // and Euclid's *Elements* refer to the same circle by every
    // permutation of its three named points (BCD ≡ CDB ≡ DBC ≡ …) and
    // to lines by either endpoint order (AB ≡ BA). Authors register
    // those equivalences here so the prose-side `{NAME}` shortcode can
    // light up the canonical element without needing a parallel
    // invisible duplicate per alias.
    private _aliases : Map<string, string> = new Map();
    protected _screen : PlaneElement;
    protected _pick : PointElement;
    protected _canvas : SlateCanvas;
    private _htmlCanvas : HTMLCanvasElement = null;
    protected _bgcolor : string;
    public    inTest : boolean = false;
    private static numSlate : number = 0;
    private _itsNumSlate : number = -1;

    constructor(canvas: SlateCanvas) {
        Slate.numSlate += 1;
        this._itsNumSlate = Slate.numSlate;

        this._elements = [];
        if(canvas == null) {
            throw new TypeError("canvas cannot be null or undefined.");
        }
        this._canvas = canvas;

        let screen_origin = new FixedPoint({x:0,y:0,z:0});
        screen_origin.name = "screen_origin";
        let screen_x      = new FixedPoint({x:1,y:0,z:0});
        screen_x.name = "screen_x";
        let screen_y      = new FixedPoint({x:0,y:1,z:0});
        screen_y.name = "screen_y";

        let screen = new PlaneElement({
                A: screen_origin,
                B: screen_x,
                C: screen_y
        });
        screen.name = "screen";
        screen.nameColor = null;
        screen.isScreen = true;
        this._screen = screen;
        this._pick = null;

        for(let e of [screen_origin, screen_x, screen_y, screen]) {
            e.nameColor = null;
            e.vertexColor = null;
            e.vertexHighlightColor = null;
            e.faceColor = null;
            e.faceHighlightColor = null;
            this._elements.push(e);
        }
        let slate = this;

        let cnv : HTMLCanvasElement = this._canvas as HTMLCanvasElement;
        this._htmlCanvas = cnv;

        if(this._htmlCanvas.addEventListener == null) return;

        // Pointer Events unify mouse / touch / stylus into one event model.
        // Setting touch-action: none here (rather than relying on
        // consumer-side CSS) tells the browser not to claim drag gestures
        // for scroll/zoom; calling setPointerCapture on pointerdown ensures
        // we keep getting move/up events even when the finger leaves the
        // canvas bounds. See issue #55 for the design rationale.
        this._htmlCanvas.style.touchAction = "none";

        // Only the primary pointer drives the drag pipeline for now.
        // Multi-touch (two-finger rotation etc.) is intentionally not yet
        // wired — design questions tracked in issue #57.
        let activePointerId: number | null = null;

        this._htmlCanvas.addEventListener("pointerdown", (ev: PointerEvent) => {
            if (activePointerId !== null) return; // already tracking a primary
            activePointerId = ev.pointerId;
            try { slate._htmlCanvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
            let [x, y] = slate._getCanvasPosition(ev.clientX, ev.clientY);
            slate._onMouseDown(x, y);
        });

        this._htmlCanvas.addEventListener("pointermove", (ev: PointerEvent) => {
            if (ev.pointerId !== activePointerId) return;
            let [x, y] = slate._getCanvasPosition(ev.clientX, ev.clientY);
            slate._onMouseDrag(x, y);
        });

        let endPointer = (ev: PointerEvent) => {
            if (ev.pointerId !== activePointerId) return;
            let [x, y] = slate._getCanvasPosition(ev.clientX, ev.clientY);
            slate._onMouseUp(x, y);
            try { slate._htmlCanvas.releasePointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
            activePointerId = null;
        };

        this._htmlCanvas.addEventListener("pointerup", endPointer);
        this._htmlCanvas.addEventListener("pointercancel", endPointer);
        this._htmlCanvas.addEventListener("lostpointercapture", (ev: PointerEvent) => {
            if (ev.pointerId === activePointerId) {
                // Browser revoked capture (e.g., system gesture); clear pick state.
                if (slate._pick != null) {
                    slate._pick = null;
                }
                activePointerId = null;
            }
        });

    }

    _getCanvasPosition(x: number, y: number) : [number, number] {
        let r = this._htmlCanvas.getBoundingClientRect();
        return [x - r.left,
                y - r.top];
    }

    _onMouseDown(x: number, y: number) {
        this._pick = null;
        this.movePick(x, y);
    };

    _onMouseUp(x: number, y: number) {
        if (this._pick == null) return;
        this.movePick(x, y);
        this._pick = null;
    };

    _onMouseDrag(x: number, y: number) {
        if (this._pick == null) return;
        this.movePick(x, y);
    };

    get elements() : GeomElement[] {
        return this._elements;
    }

    set bgcolor(value: string ) {
        this._bgcolor = value;
    }

    get bgcolor() : string {
        return this._bgcolor;
    }

    lookupElement(name: string) : GeomElement {
        for (let elem of this._elements) {
            if (elem.name == name) {
                return elem;
            }
        }
        // Direct miss — follow the alias map and look up the canonical
        // name. One hop only: we don't chase chains because aliases are
        // expected to point at real element names, not at each other.
        let canonical = this._aliases.get(name);
        if (canonical != null) {
            for (let elem of this._elements) {
                if (elem.name == canonical) return elem;
            }
        }
        return null;
    }

    // Register a single secondary name → canonical name mapping. Idempotent.
    // Called by init() when the user passes an `aliases` field.
    addAlias(from: string, to: string) : void {
        this._aliases.set(from, to);
    }

    addAliases(aliases: {[from: string]: string}) : void {
        for (let from in aliases) this._aliases.set(from, aliases[from]);
    }

    // Sort params into P[] (points), E[] (other elements), N[] (integers),
    // matching Java's selectDataChoice (Slate.java lines 344-393).
    // LineElements are expanded into their two endpoint PointElements.
    convertParams(params: any[]) : SortedParams {
        let P: PointElement[] = [];
        let E: GeomElement[] = [];
        let N: number[] = [];
        for(let param of params) {
            switch(typeof(param)) {
                case "string":
                    let g : GeomElement = this.lookupElement(param);
                    if ( g == null )
                        throw new TypeError(`Element with name ${param} not found.`);
                    if (g instanceof PointElement) {
                        P.push(g);
                    } else if (g instanceof LineElement) {
                        // LineElement expands to two PointElements (matching Java)
                        P.push(g.A);
                        P.push(g.B);
                    } else {
                        E.push(g);
                    }
                    break;
                case "number":
                    N.push(param);
                    break;
                default:
                    throw new TypeError("Expecting only named elements (strings) or numbers.");
            }
        }
        return {P, E, N};
    }

    findConstruction(cm : AllConstructions, sp: SortedParams) : Construction {
        for(let c of constructions) {
            if(c.validateSignature(cm, sp)) {
                return c;
            }
        }
        return null;
    }

    createElement(cm : AllConstructions, params: any[], name?: string) : GeomElement {
        let sp : SortedParams = this.convertParams(params);
        let c : Construction = this.findConstruction(cm, sp);
        if(c == null) {
            let cName : String = getConstructionName(cm);
            if (name == null) {
                name = "";
            }
            throw new TypeError(`Construction not found for "${name}" ${cName} with params P=[${sp.P}] E=[${sp.E}] N=[${sp.N}]`);
        }
        let [gs, g] = c.construct(this._screen, sp.P, sp.E, sp.N);
        // Mark as preexisting if this element was already in _elements
        // before this construction (e.g., point;first returns an existing
        // PointElement). Preexisting elements are skipped during
        // rotate/translate to avoid double-movement.
        // (Java: Slate.java preexists[] array)
        if (this._elements.indexOf(g) !== -1) {
            g.preexists = true;
        }
        if(name != null)
            g.name = name;
        for (let elem of gs) {
            if (this._elements.indexOf(elem) == -1)
                this._elements.push(elem);
        }
        if(this._elements.indexOf(g) == -1)
            this._elements.push(g);
        return g;
    }

    reset() : void {
        for (let element of this._elements) {
            element.reset();
        }
        this.update();
    }

    update() : void {
        for(let element of this._elements) element.update();
        this.drawElements();
    }

    drawElements(): void {
        if(this.inTest) return;
        // we draw all the elements first
        let w = this._canvas.width;
        let h = this._canvas.height;
        let ctx : CanvasRenderingContext2D = this._canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = this._bgcolor;
        ctx.fillRect(0,0,w,h);
        for(let element of this._elements) element.drawFace(this._canvas);
        for(let element of this._elements) element.drawEdge(this._canvas);
        for(let element of this._elements) element.drawVertex(this._canvas);
        // and then draw their names.
        for(let element of this._elements)
            element.drawName(this._canvas);
    }

    // Update coordinates starting with element[i+1], matching Java's
    // Slate.java updateCoordinates (lines 808-814). Only elements AFTER
    // the picked element are recomputed — elements before it are left
    // untouched to avoid reprojection artifacts after rotation.
    updateCoordinates(i : number) {
        for(++i; i < this._elements.length; i++) {
            if(!this._elements[i].defined())
                this._elements[i].reset();
            this._elements[i].update();
        }
        this.drawElements();
    }

    translateCoordinates(dx : number, dy: number) {
        // translate all non-preexisting elements
        // (Java: Slate.java line 819 — if (!preexists[i]) element[i].translate(...))
        for(let i = 0; i < this._elements.length; i++) {
            let elem = this._elements[i];
            if (!elem.preexists)
                elem.translate(dx, dy);
        }
        this.update();
    }

    closestVisiblePoint(elements : GeomElement[], p : PointElement, tolerance : number = 30) : PointElement {
        // Use 2D screen distance (x,y only, ignoring z) for picking,
        // matching the Java applet's movePick() at Slate.java:887-889.
        // The canvas is a 2D projection; a 3D point at (x,y,z) renders
        // at screen position (x,y) regardless of z.
        let screenDist2 = (a: PointElement, b: PointElement) =>
            (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
        let sortedDistanceElements = elements
            .filter(e => e instanceof PointElement)
            .map(e => e as PointElement)
            .filter(e => e.vertexColor != null)
            .sort((a,b) => {
                let adcp = screenDist2(a, p);
                let bdcp = screenDist2(b, p);
                if(adcp < bdcp) {
                    return -1;
                } else if (bdcp < adcp) {
                    return 1;
                }
                return 0;
            });
        if (sortedDistanceElements.length == 0) return null;
        let bestDistPoint = sortedDistanceElements[0];
        if(Math.sqrt(screenDist2(bestDistPoint, p)) > tolerance) return null;
        return bestDistPoint;
    }

    private _getPick(c: number, d: number) : PointElement {
        if (this._pick != null) return this._pick;
        let currentPoint = new PointElement({x:c,y:d});
        let closestVisiblePoint = this.closestVisiblePoint(this._elements, currentPoint);
        if(closestVisiblePoint == null) return;
        this._pick = closestVisiblePoint;
        return this._pick;
    }

    // Set the pivot point for scene rotation.
    // Format: "pointName" or "pointName,planeName"
    // Without a plane, the pivot is set on the screen plane.
    // With a plane, the pivot is set on that plane (for 3D rotation).
    // (Java: Slate.java setPivot, lines 787-801)
    setPivot(param : string) : void {
        let parts = param.split(",");
        let pointName = parts[0].trim();
        let e : GeomElement = this.lookupElement(pointName);
        if (e == null || !(e instanceof PointElement)) return;
        let piv : PointElement = e as PointElement;

        if (parts.length > 1) {
            // "A,xyplane" — set pivot on a specific plane
            let planeName = parts[1].trim();
            let p : GeomElement = this.lookupElement(planeName);
            if (p == null || !(p instanceof PlaneElement)) return;
            (p as PlaneElement).pivot = piv;
        } else {
            // "A" — set pivot on screen plane
            piv._AP = this._screen;
            this._screen.pivot = piv;
        }
    }

    movePick(c: number, d: number) : void {
        if(this._getPick(c, d) == null) return;
        let picki = this._elements.indexOf(this._pick);

        let w : number = this._canvas.width;
        if (c < 0) c = 0;
        else if (c > w) c = w;
        let h : number = this._canvas.height;
        if (d < 0) d = 0;
        else if (d > h) d = h;
        if (Math.abs(c - this._pick.x) + Math.abs(d - this._pick.y) < 1.0) {
            return; // no motion
        }
        if ( this._pick.draggable ) {
            if(this._pick.drag(c,d)) {
                this.updateCoordinates(picki);
            } else {
                return;
            }
        } else if (this._pick.AP != null 
          && this._pick.AP.pivot != null
          && this._pick.AP.pivot != this._pick) { // rotate around the pivot
              this.rotateCoordinates(c,d);
        } else {
            let dx = c - this._pick.x;
            let dy = d - this._pick.y;
            this.translateCoordinates(dx,dy);
        }
        this.drawElements();
    }

    rotateCoordinates(c : number, d : number) : void {
      // rotate space according to how pick goes around pivot in the plane
      let pick : PointElement = this._pick;
      let piv : PointElement = pick.AP.pivot;
      // compute old and new pick's 3D coordinates relative to the pivot
      let oldP : PointElement = PointElement.difference(pick,piv);
      let newx : number = c-piv.x;
      let newy : number = d-piv.y;		//(newz is irrelevant)
      // find their 2D coordinates on the plane
      let S : PointElement = pick.AP.S;
      let T : PointElement = pick.AP.T;
      let olds : number = PointElement.dot(oldP,S);
      let oldt : number = PointElement.dot(oldP,T);
      let den  : number = S.x * T.y - S.y * T.x;
      let news : number = (newx*T.y - newy*T.x)/den;
      let newt : number = (newy*S.x - newx*S.y)/den;
      // compute the scale&rotation factors
      den = olds*olds + oldt*oldt;
      let ac : number = (news*olds + newt*oldt)/den;
      let as : number = (newt*olds - news*oldt)/den;
      // Rotate all non-preexisting elements directly.
      // (Java: Slate.java line 843-845)
      for (let elem of this._elements) {
          if (!elem.preexists)
              elem.rotate(piv, ac, as);
      }
      // After direct rotation, recompute derived elements from their (now
      // rotated) parents. Java doesn't need this because element[] carries
      // duplicate entries for shared objects — a Layoff created by
      // line;extend and re-referenced by point;last appears at two indices,
      // one with preexists=false that gets rotated directly. TS dedupes
      // _elements, so a shared object marked preexists=true is skipped,
      // which means Layoff-style points backed by bare LineElement wrappers
      // would never get moved directly (bare LineElement.rotate is a no-op).
      // Running update() rebuilds them from their (rotated) parents, which
      // produces the same result because rotation is a linear operation
      // and Layoff.update() derives its position from parent coords.
      this.update();
    }

}
