// @flow

export class Component {}

export class Renderable extends Component {
  glyph: string;

  constructor({ glyph }: { glyph: string }) {
    super();

    if (glyph.length !== 1) {
      throw new Error('Glyph length must equal 1.');
    }

    this.glyph = glyph;
  }
}

export class Transform extends Component {
  // TODO Put this in position class
  x: number;
  y: number;

  constructor({ x, y }: { x: number, y: number }) {
    super();
    this.x = x;
    this.y = y;
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

export class Player extends Component {}
