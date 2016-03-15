import angular from 'angular'
import CorrelationRendererModule from './correlation-renderer'
import DataManagerModule from './data-manager'
import DistributionRendererModule from './distribution-renderer'
import MapRendererModule from './map-renderer'
import SIManagerModule from './si-manager'

const modName = 'squid-hsi.services';

angular.module(modName, [
  CorrelationRendererModule,
  DataManagerModule,
  DistributionRendererModule,
  MapRendererModule,
  SIManagerModule,
])
.service('VariableMapRenderer', (MapRenderer) => {
  return new MapRenderer;
})
.service('SIMapRenderer', (MapRenderer) => {
  return new MapRenderer;
})
.service('SIMapRenderer2', (MapRenderer) => {
  return new MapRenderer;
})
.service('HSIMapRenderer', (MapRenderer) => {
  return new MapRenderer;
})

export default modName
