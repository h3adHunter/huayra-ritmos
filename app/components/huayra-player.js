import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['huayra-player'],
  pattern: null,
  player: null,
  recordTitle: null,

  audio: Ember.inject.service(),
  recorder: Ember.inject.service(),
  playing: false,
  timer: null,

  connectKeyHandlers: Ember.on('didInsertElement', function() {
    this.set('eventHandler', this.keyHandler.bind(this));
    this.$(document).bind('keydown', this.get('eventHandler'));
  }),

  disconnectKeyHandlers: Ember.on('willClearRender', function() {
    this.stop();
    this.$(document).unbind('keydown', this.get('eventHandler'));
  }),

  keyHandler(e) {

    // Si es la tecla SPACE
    if (e.keyCode === 32) {
      this.send('togglePlay');
    }

    // Permite usar las teclas 1, 2, 3 ... 9 para habilitar o deshabilitar
    // los tracks inividualmente.
    if (e.keyCode >= 49 && e.keyCode <= 57) {
      this.send('toggleEnabledTrackByIndex', e.keyCode - 48);
    }

  },

  play() {
    this.playStep();
  },

  playCurrentStepSound() {
    var currentStep = this.get('player.currentStep');
    var tracks = this.get('pattern.tracks');

    tracks.forEach((t) => {
      if (t.enabled) {
        if (t.steps[currentStep].active) {
          let volume = t.volume || 1;            // aplica el volumen global.
          volume = parseFloat(volume, 10);
          volume *= (t.steps[currentStep].volume || 1); // aplica el volumen del step.

          this.get('audio').play(t.sound, volume);
        }
      }

    });
  },

  playStep() {
     var delay = ((1000 * 60)/4) / (this.get('pattern.bpm') || 120);

    this.playCurrentStepSound();

    var timer = Ember.run.later(() => {
      this.incrementProperty('player.currentStep');

      if (this.get('player.currentStep') > ((this.get('player.stepsLimit')-1) || 15)) {
        this.set('player.currentStep', 0);
        this.get('recorder').trigger('pattern-end');
      }

      this.playStep();
    }, delay);

    this.set('timer', timer);
  },

  stop() {
    this.set('player.currentStep', 0);

    if (this.get('timer')) {
      Ember.run.cancel(this.get('timer'));
      this.set('timer', null);
    }
  },

  actions: {

    /*
     * Intenta habilitar o deshabilitar un track dado un número o posición.
     */
    toggleEnabledTrackByIndex(index) {
      var track = this.get('pattern.tracks')[index-1];

      if (track) {
        var lastValue = Ember.get(track, 'enabled');
        Ember.set(track, 'enabled', !lastValue);
      }
    },

    /*
     * Alterna la reproducción del track.
     *   how: Boolean?
     *     true -> Play
     *     false -> Stop
     *     undefined -> !playing
     */
    togglePlay(how) {
      /* how es su valor o toggleo playing */
      how = how === undefined ? !this.get('playing') : how;

      /* Si no hay nada para hacer entonces no hay nada para hacer */
      if(how === this.get('playing')) {
        return;
      }

      this.set('playing', how);

      if(this.get('playing')) {
        this.set('player.playing', true);
        this.play();
      } else {
        this.set('player.playing', false);
        this.stop();
      }

    },

    /*
     * Actualiza la cantidad de bloques a reproducir.
     * 16, 12, 8, 4, 2?
     */
    updateStepsLimit(steps) {
      this.set('player.stepsLimit', steps);
      var tracks = this.get('pattern.tracks');
      tracks.forEach((t) => {
        // aca habilitamos a los pasos "disponibles"
        t.steps.slice(0, steps).forEach((s) => {
          Ember.set(s, "disabled", false);
        });
        // aca deshabilitamos al resto
        t.steps.slice(steps).forEach((s) => {
          Ember.set(s, "disabled", true);
        });
      });
    },

    /*
     *
     */
    toggleRecord() {
      this.send('togglePlay', true);

      if(this.get('recorder.recording')) {
        this.get('recorder').cancelRecording();
      } else {
        this.get('recorder').record(
          this.get('recordTitle'),
          this.get('pattern.bpm'),
          this.get('player.stepsLimit')
        ).then((file) => {
          this.send('togglePlay', false);
          saveSound(file, this.get('recordTitle'));
        }, () => {
          this.send('togglePlay', false);
        });
      }
    }
  }
});
