// @flow

import type { Entity } from 'entity';
import { Metadata } from 'component';

export interface Tactic {
  execute(): boolean,
}

export class If implements Tactic {
  condition: Tactic;
  success: Tactic;
  failure: Tactic;

  constructor({
    condition,
    success,
    failure,
  }: {
    condition: Tactic,
    success: Tactic,
    failure: Tactic,
  }) {
    this.condition = condition;
    this.success = success;
    this.failure = failure;
  }

  execute() {
    if (this.condition.execute()) {
      return this.success.execute();
    } else {
      return this.failure.execute();
    }
  }
}

export class And implements Tactic {
  first: Tactic;
  second: Tactic;

  constructor({ first, second }: { first: Tactic, second: Tactic }) {
    this.first = first;
    this.second = second;
  }

  execute() {
    return this.first.execute() && this.second.execute();
  }
}

export class LessThan implements Tactic {
  first: number;
  second: number;

  constructor({ first, second }) {
    this.first = first;
    this.second = second;
  }

  execute() {
    return this.first < this.second;
  }
}

export class ConsoleTactic implements Tactic {
  message: string;

  constructor({ message }) {
    this.message = message;
  }

  execute() {
    console.log(this.message);
    return true;
  }
}

export class GetProp implements Tactic {
  entity: string;
  component: Function;
  prop: string;

  constructor({ entity, component, prop }) {
    this.entity = entity;
    this.component = component;
    this.prop = prop;
  }

  execute() {
    return true;
  }
}

export class Playground {
  run() {
    const fetch = new ConsoleTactic({
      message: new GetProp({
        entity: 1,
        component: Metadata,
        prop: 'name',
      }),
    });

    const t = new If({
      condition: new LessThan({
        first: 10,
        second: 30,
      }),
      success: new And({
        first: new ConsoleTactic({
          message: 'First one true',
        }),
        second: new If({
          condition: new LessThan({
            first: 10,
            second: 20,
          }),
          success: new ConsoleTactic({
            message: 'Both true',
          }),
        }),
      }),
      failure: new ConsoleTactic({
        message: 'Failure',
      }),
    });

    t.execute();
  }
}
