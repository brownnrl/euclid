import {GeomElement} from "../GeomElement";
import {PointElement} from "../point/PointElement";

export class PlaneElement extends GeomElement {

    protected _A : PointElement;
    protected _B : PointElement;
    protected _C : PointElement;
    protected _S : PointElement;
    protected _T : PointElement;
    protected _U : PointElement;


    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
    }

    protected drawEdge(): void {
    }

    protected drawFace(): void {
    }

    protected drawName(d: paper.Rectangle): void {
    }

    protected drawVertex(): void {
    }

    protected rotate(pivot: paper.Point, ac: number, as: number): void {
    }

    protected translate(dx: number, dy: number): void {
    }

    protected update(): void {
    }
}
