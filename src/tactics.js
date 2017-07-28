// @flow

interface Tactic {
  execute(): boolean,
}

export class Predicate implements Tactic {
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

export class Playground {
  run() {
    const t = new Predicate({
      condition: new LessThan({
        first: 40,
        second: 30,
      }),
      success: new ConsoleTactic({
        message: 'Success!',
      }),
      failure: new ConsoleTactic({
        message: 'Failure',
      }),
    });

    t.execute();
  }
}
