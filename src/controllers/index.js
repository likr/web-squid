import angular from 'angular'
import SettingControllerModule from './setting-controller'
import MainControllerModule from './main-controller'
import SITabControllerModule from './si-tab-controller'
import HSITabControllerModule from './hsi-tab-controller'

const modName = 'squid-hsi.controllers';

angular.module(modName, [
  SettingControllerModule,
  MainControllerModule,
  SITabControllerModule,
  HSITabControllerModule,
]);

export default modName
