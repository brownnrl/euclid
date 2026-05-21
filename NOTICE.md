# Notice and Attribution

## About this project

**geomlib** is a TypeScript port of David E. Joyce's *Geometry Applet*
(Clark University, 1996, Java version 2.2), originally written to
illustrate Euclid's *Elements* on the web. The port reimplements the
applet's construction model on top of the HTML5 `<canvas>` element so
the diagrams render in modern browsers without a Java plugin.

## Permission

The port was undertaken with Dr. Joyce's explicit permission, granted
on May 3, 2026 via Quora in response to a video demonstration of the
port. His response:

> Very nice. I haven't had access to my files at Clark since I retired.
> ... Feel free to continue doing as much as you like. You have my
> permission to port as much of the Elements and Geometry Applet as you
> want, and distribute it however you like.
>
> Thank you very much.
>
> David Joyce
> Professor Emeritus, Clark University

Original answer: [Quora — *Dr. Joyce, I completed a TypeScript port of the Geometry Applet…*](https://www.quora.com/Dr-Joyce-I-completed-a-TypeScript-port-of-the-Geometry-Applet-The-interactive-diagrams-work-in-modern-browsers-I-made-a-short-video-demonstration-https-youtu-be-zQVC4TPUhiQ-Would-you-be-willing-to-watch-it-and-see/answer/David-Joyce-11)

A screenshot of the Quora answer is preserved at
[doc/license/joyce_permission.png](doc/license/joyce_permission.png).

## License

The TypeScript source in this repository is released under the **MIT
License** (see [LICENSE](LICENSE)), under joint copyright:

> Copyright (c) 1996–2020 David E. Joyce, 2019–2026 Nelson Brown

Joyce's years credit his authorship of the original Java applet and
its continued maintenance through the *Elements* web edition. Brown's
years credit the TypeScript port.

## Preserved Java artifacts

The directory [geom_applet/](geom_applet/) contains:

- `source/*.java` — the original Java source files for the Geometry
  Applet, © David E. Joyce, included by permission as historical
  reference.
- `Geometry.zip` — the original 1998 deployable applet archive, © David
  E. Joyce, included by permission.

These materials are not maintained as part of the TypeScript port;
they are preserved verbatim for reference and historical fidelity.

## Related: *Elements* narrative content

Joyce's translation and commentary on Euclid's *Elements* are not
included in this code repository. They are published as a separate
site at [euclids-elements.org](https://euclids-elements.org), which
carries its own copyright notice.
