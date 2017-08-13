import { Component } from '@angular/core';
import { NavController, LoadingController, ToastController } from 'ionic-angular';
import * as mapboxgl from 'mapbox-gl';
import { AboutPage } from '../about/about';
import { UnderService } from '../../shared/under.service';
import { LocService } from '../../shared/loc.service';
import { layers } from '../../shared/layers';
import * as ArcGISRasterTileSource from 'mapbox-gl-arcgis-tiled-map-service';

const accessToken = 'pk.eyJ1IjoiZmx5b3ZlcmNvdW50cnkiLCJhIjoiNDI2NzYzMmYxMzI5NWYxMDc0YTY5NzRiMzdlZDIyNTAifQ.x4T-qLEzRQMNFIdnkOkHKQ';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [UnderService, LocService]
})
export class HomePage {
  public map: any;
  public currentLocation: any;
  public locationMarker: any;
  constructor(public underService: UnderService, public locService: LocService, public navCtrl: NavController, public loadingCtrl: LoadingController, public toastCtrl: ToastController) {
    (mapboxgl as any).accessToken = accessToken;
  }
  ngOnInit(): void {
    this.mapCtrl();
  }
  mapCtrl(): void {
    let bounds:number[][] = [
      [-97.53662, 42.994854], // Southwest coordinates
      [-89.49462, 49.24472443]  // Northeast coordinates
    ]
    this.map = new mapboxgl.Map({
      center: [-94.349742, 45.98909],
      zoom: 7,
      maxBounds: bounds,
      maxZoom: 17,
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9'
    });
    this.map.on('load', () => {
      this.map.addSourceType('arcgisraster', ArcGISRasterTileSource, function(err) {
        if(err){
          /*do something*/
        }
      });
      this.map.addSource('mnLidar', layers.mnLidar);
      this.map.addSource('colorTopo', layers.colorTopo);
      this.map.addLayer({
         'id': 'mnLidar',
         'type': 'raster',
         'source':"mnLidar",
         'maxzoom': 18,
         'minzoom': 7
       }, 'waterway-river-canal');
     this.map.addLayer({
        'id': 'colorTopo',
        'type': 'raster',
        'source':"colorTopo",
        'maxzoom': 18,
        'minzoom': 7
      }, 'waterway-river-canal');
    this.map.setPaintProperty('colorTopo', 'raster-opacity', 0.25);
    this.addLocationMarker(8);
    let nav = new mapboxgl.NavigationControl();
    this.map.addControl(nav, 'top-left');
    })
    this.map.on('click', (e) => {
      this.getTappedGeo(e);
      //add marker in the future
    });
  }
  addLocationMarker(zoom): void {
    let el = document.createElement('div');
    el.id = 'marker';
    this.locationMarker = new mapboxgl.Marker(el)
    this.locService.watchLocation()
      .subscribe(
        res => {
          this.currentLocation = [res.coords.longitude, res.coords.latitude];
          this.locationMarker
            .setLngLat(this.currentLocation)
            .addTo(this.map);
        },
        err => {
          let toast = this.toastCtrl.create({
            message: 'Geolocation unavailable',
            duration: 3000,
            position: 'top'
          });
          toast.present();
        }
    );

  }
  getTappedGeo(e): void {
    let loading = this.loadingCtrl.create();
    loading.present();
    this.underService.getUnder(e.lngLat)
    .then(UnderData => {
      this.renderData(UnderData);
      loading.dismiss();
    })
    .catch(ex => {
      console.error('Error getting Geology', ex);
      loading.dismiss();
      let toast = this.toastCtrl.create({
        message: 'Error finding geological information.',
        duration: 3000,
        position: 'top'
      });
      toast.present();
    });
  }
  hereNow():void {
    if (this.currentLocation) {
      let loading = this.loadingCtrl.create();
      loading.present();
      let loc = {
        lat: this.currentLocation[1],
        lng: this.currentLocation[0]
      };
      this.underService.getUnder(loc)
      .then(UnderData => {
        this.renderData(UnderData);
        loading.dismiss();
       })
       .catch(ex => {
         console.error('Error getting Geology', ex);
         loading.dismiss();
         let toast = this.toastCtrl.create({
           message: 'Error finding geological information.',
           duration: 3000,
           position: 'top'
         });
         toast.present();
       });
    } else {
      let toast = this.toastCtrl.create({
        message: 'current location unknown.',
        duration: 3000,
        position: 'top'
      });
      toast.present();
    }
  }
  fabLocate(): void {
    let center = this.currentLocation;
    this.locationMarker.remove();
    this.locationMarker
      .setLngLat(center)
      .addTo(this.map);
    this.map.flyTo({center: center, zoom: 15});
  }
  renderData(under): void {
    this.navCtrl.push(AboutPage, {
      under: under
    });
  }
}
