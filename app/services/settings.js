import Ember from 'ember';

export default Ember.Service.extend({
  userHome: null,
  configPath: null,
  config: null,
  getUserPrefix: null,

  init() {

    if (isNodeWebkit) {
      this.set('userHome', (process.env.HOME || process.env.USERPROFILE).replace(/\/$/,''));

      let fs = window.requireNode('fs');
      var defaultUserPath = this.get('userHome') + "/.local/share/huayra-ritmos";
      var configPath = this.get('userHome') + "/.config/huayra-ritmos/";
      this.set('configPath', configPath);


      // si no existen los directorios, los creamos
      if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath);
      }

      if (!fs.existsSync(defaultUserPath)) {
        fs.mkdirSync(defaultUserPath);
      }

      var homeConfig = window.requireNode('home-config');

      var config = homeConfig.load(configPath + '/huayra-ritmos.ini', {
        userPrefix: defaultUserPath
      });

      config.save();

      this.set('config', config);
      this.set('getUserPrefix', config.userPrefix);
    }

  },

  setUserPrefix(newPath){
    var config = this.get('config');
    config.userPrefix = newPath;
    config.save();
    this.set('config', config);
  },

  getPrefix() {

    if (isNodeWebkit) {
      let fs = window.requireNode('fs');

      if (fs.existsSync('../dist')) {
        return "../dist/";
      } else {
        return "";
      }
    }

    return "";
  }
});
