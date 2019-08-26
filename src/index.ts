import paper = require("paper")
import {GeomElement} from "./elements/GeomElement"
import {PointElement} from "./elements/point/PointElement";

export class ImplementedGeomElement extends GeomElement {
    protected drawEdge(): void {
    }

    protected drawFace(): void {
    }

    protected drawName(d: paper.Rectangle): void {
    }

    protected drawVertex(): void {
    }

    protected rotate(pivot: PointElement, ac: number, as: number): void {
    }

    protected translate(dx: number, dy: number): void {
    }

    protected update(): void {
    }
}

export enum ShapeKind {
  Circle,
  Square,
}

interface Circle {
  kind: ShapeKind.Circle;
  radius: number;
}

interface Square {
    kind: ShapeKind.Square;
    sideLength: number;
}

let c: Circle = {kind: ShapeKind.Circle, radius: 100}

export function StartClock() {
    console.log("starting clock...");
    // Below is the way to call animation
    const canvas = <HTMLCanvasElement>document.getElementById('canvasId');
    new Clock(canvas);
}

export function TryPaperJs() {
    console.log("trying paper js");
    const canvas = <HTMLCanvasElement>document.getElementById('canvasId');
    paper.setup(canvas);

    // Circle
    let path = new paper.Path.Circle({
        center: [80, 50],
        radius: 35,
        fillColor: 'red'
    });

    // Dotted Line Tool
    let dottedLinePath: paper.Path = new paper.Path;
    let dottedLineTool = new paper.Tool();

    dottedLineTool.onMouseDown = function(event: any) {
        new paper.Layer().activate();
        dottedLinePath = new paper.Path();
        dottedLinePath.strokeColor = '#00';
        dottedLinePath.strokeWidth = 2;
        dottedLinePath.dashArray = [5, 8];
        dottedLinePath.strokeCap = 'round';
        dottedLinePath.strokeJoin = 'round';
        dottedLinePath.add(event.point);
    };

    dottedLineTool.onMouseDrag = function(event: any) {
        dottedLinePath.add(event.point);
    };

    dottedLineTool.onMouseUp = function(event: any) {
        dottedLinePath.smooth();
        dottedLinePath.simplify();
    };

}


export class Clock {
    private readonly ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        if(canvas == null) return;
        this.ctx = canvas.getContext('2d');
        window.requestAnimationFrame(() => this.draw());
    }

    HelloWorld() {
        console.log("hello world!");
    }

    draw() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, 150, 150);
        this.ctx.translate(75, 75);
        this.ctx.scale(0.4, 0.4);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.strokeStyle = 'black';
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        // Hour marks
        this.ctx.save();
        for (var i = 0; i < 12; i++) {
            this.ctx.beginPath();
            this.ctx.rotate(Math.PI / 6);
            this.ctx.moveTo(100, 0);
            this.ctx.lineTo(120, 0);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // Minute marks
        this.ctx.save();
        this.ctx.lineWidth = 5;
        for (i = 0; i < 60; i++) {
            if (i % 5 != 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(117, 0);
                this.ctx.lineTo(120, 0);
                this.ctx.stroke();
            }
            this.ctx.rotate(Math.PI / 30);
        }
        this.ctx.restore();

        const now = new Date();
        const sec = now.getSeconds();
        const min = now.getMinutes();
        let hr = now.getHours();
        hr = hr >= 12 ? hr - 12 : hr;

        this.ctx.fillStyle = 'black';

        // write Hours
        this.ctx.save();
        this.ctx.rotate(
            hr * (Math.PI / 6) + (Math.PI / 360) * min + (Math.PI / 21600) * sec
        );
        this.ctx.lineWidth = 14;
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        this.ctx.lineTo(80, 0);
        this.ctx.stroke();
        this.ctx.restore();

        // write Minutes
        this.ctx.save();
        this.ctx.rotate((Math.PI / 30) * min + (Math.PI / 1800) * sec);
        this.ctx.lineWidth = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(-28, 0);
        this.ctx.lineTo(112, 0);
        this.ctx.stroke();
        this.ctx.restore();

        // Write seconds
        this.ctx.save();
        this.ctx.rotate((sec * Math.PI) / 30);
        this.ctx.strokeStyle = '#D40000';
        this.ctx.fillStyle = '#D40000';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);
        this.ctx.lineTo(83, 0);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2, true);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(95, 0, 10, 0, Math.PI * 2, true);
        this.ctx.stroke();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2, true);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.beginPath();
        this.ctx.lineWidth = 14;
        this.ctx.strokeStyle = '#325FA2';
        this.ctx.arc(0, 0, 142, 0, Math.PI * 2, true);
        this.ctx.stroke();

        this.ctx.restore();

        window.requestAnimationFrame(() => this.draw());
    }
}
