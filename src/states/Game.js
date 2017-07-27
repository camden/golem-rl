// @flow
import Phaser from 'phaser';

import {
  TurnSystem,
  AISystem,
  RenderSystem,
  PlayerInputSystem,
  System,
} from 'systems';
import type { Entity } from 'entity';
import {
  Metadata,
  Collidable,
  Turn,
  Transform,
  Player,
  Renderable,
  Actor,
} from 'component';
import ComponentManager from 'component-manager';
import ROT from '../../vendor/rot.min.js';
import MapConfig from 'config/map.json';

export default class extends Phaser.State {
  // TODO Make this its own class
  componentManager: ComponentManager;
  systems: {
    render: Array<System>,
    update: Array<System>,
  };
  entities: Array<Entity>;

  init() {}
  preload() {}

  create() {
    this.engine = {};

    this.engine.log = ['log initialized'];

    this.componentManager = new ComponentManager();
    this.componentManager.register({
      components: [
        Actor,
        Metadata,
        Player,
        Turn,
        Collidable,
        Transform,
        Renderable,
      ],
    });

    this.entities = [];

    const rm = new ROT.Map.Cellular(MapConfig.width, MapConfig.height);
    rm.randomize(0.4);

    let nextEntity = 3;

    rm.create((x, y, createWallNumber) => {
      if (createWallNumber === 0) {
        return;
      }

      this.entities.push(nextEntity);
      this.componentManager.add({
        entity: nextEntity,
        components: [
          new Collidable(),
          new Transform({ x: x, y: y }),
          new Renderable({ glyph: 'W' }),
          new Metadata({ name: 'Wall', description: 'A solid stone wall.' }),
        ],
      });
      nextEntity++;
    });

    // TODO add assemblages
    const enemyEntity = 2;
    this.entities.push(enemyEntity);
    this.componentManager.add({
      entity: enemyEntity,
      components: [
        new Collidable(),
        new Turn({ speed: 10 }),
        new Transform({ x: 2, y: 4 }),
        new Renderable({ glyph: 'S' }),
        new Actor(),
        new Metadata({
          name: 'Skeleton',
          description: 'A spooky boneman',
        }),
      ],
    });

    // Do this automatically
    const playerEntity = 1;
    this.entities.push(playerEntity);
    this.componentManager.add({
      entity: playerEntity,
      components: [
        new Collidable(),
        new Player(),
        new Turn({ speed: 10 }),
        new Transform({ x: 1, y: 4 }),
        new Renderable({ glyph: '@' }),
        new Metadata({
          name: 'Player (you)',
          description: 'The hero of our tale.',
        }),
      ],
    });

    this.initializeSystems();
    this.log = this.game.add.text('', 200, 10, {
      font: '10pt Monaco, monospace',
      wordWrapWidth: 100,
    });
    this.log.alignIn(this.game.world.bounds, Phaser.RIGHT_TOP, -400);

    this.fps = this.game.add.text(0, 0, 10);
    this.game.time.advancedTiming = true;
  }

  initializeSystems() {
    this.systems = {
      update: [],
      render: [],
    };

    this.systems.render.push(
      new RenderSystem(this.componentManager, this.game)
    );

    this.systems.update.push(
      new TurnSystem(this.componentManager, this.game),
      new AISystem(this.componentManager, this.game),
      new PlayerInputSystem(this.componentManager, this.game)
    );
  }

  update() {
    for (let system of this.systems.update) {
      system.update(this.entities);
    }

    this.log.setText(this.engine.log.slice().reverse().join('\n'));
    this.fps.setText(this.game.time.fps);
  }

  render() {
    for (let system of this.systems.render) {
      system.update(this.entities);
    }
  }
}
