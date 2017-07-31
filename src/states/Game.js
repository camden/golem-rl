// @flow
import Phaser from 'phaser';
import seedrandom from 'seedrandom';

import { TurnSystem, AISystem, RenderSystem, System } from 'systems';
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
import { onKeyEvent } from 'input';
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
    // Set the random seed
    const seed = 40;
    seedrandom(seed, { global: true });
    ROT.RNG.setSeed(seed);

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
        new Turn({ recharge_time: 12 }),
        new Transform({ x: 6, y: 4 }),
        new Renderable({ glyph: 'S' }),
        new Actor({
          // TODO make these classes, not strings
          tactics: [
            {
              name: 'move_towards_player',
              params: {
                sight: 10,
              },
            },
            {
              name: 'wander',
              params: {},
            },
          ],
        }),
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
        new Turn({ recharge_time: 10 }),
        new Transform({ x: 1, y: 4 }),
        new Renderable({ glyph: '@' }),
        new Metadata({
          name: 'Player (you)',
          description: 'The hero of our tale.',
        }),
      ],
    });

    this.systems = this.initializeSystems();

    this.log = this.game.add.text('', 200, 10, {
      font: '10pt Monaco, monospace',
      wordWrapWidth: 100,
    });
    this.log.alignIn(this.game.world.bounds, Phaser.RIGHT_TOP, -400);

    this.fps = this.game.add.text(0, 0, 10);
    this.game.time.advancedTiming = true;

    window.addEventListener(
      'keydown',
      event => {
        onKeyEvent(event, this.componentManager);
      },
      false
    );
  }

  initializeSystems() {
    const systems = {
      update: [],
      render: [],
    };

    systems.render.push(new RenderSystem(this.componentManager, this.game));

    systems.update.push(
      new TurnSystem(this.componentManager, this.game),
      new AISystem(this.componentManager, this.game)
    );

    return systems;
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
