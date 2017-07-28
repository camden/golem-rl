// @flow

import { Tactic } from 'tactics';

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

export class Tactics extends Component {
  tactic: Tactic;

  constructor({ tactic }: { tactic: Tactic }) {
    super();
    this.tactic = tactic;
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

export class Metadata extends Component {
  name: string;
  description: string;

  constructor({ name, description }: { name: string, description: string }) {
    super();
    this.name = name;
    this.description = description;
  }
}

export class Collidable extends Component {}

export class Actor extends Component {}
export class Player extends Component {}

export class Turn extends Component {
  speed: number;
  nextTurnTime: number;
  myTurn: boolean;

  constructor({ speed }: { speed: number }) {
    super();
    this.myTurn = false;
    this.speed = speed;
    this.nextTurnTime = speed;
  }
}
