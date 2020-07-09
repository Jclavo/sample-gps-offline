import { Component } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';

//Models
import { Coordenates } from "src/app/models/coordenates.model";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  readonly database_name: string = "tracking.db";
  readonly table_name: string = "coordenates";
  private sqliteObject: SQLiteObject;

  public coordenates = new Coordenates();
  public coordenatesList: Array<Coordenates> = [];

  constructor(
    private platform: Platform,
    private sqlite: SQLite,
    private geolocation: Geolocation,
    private diagnostic: Diagnostic

  ) {

    this.platform.ready().then(() => {
      this.runInitialSQLConfigurations()
    }).catch(error => {
      console.log(error);
    })
  }

  runInitialSQLConfigurations() {
    this.createDB();

  }

  // Create DB if not there
  createDB() {
    this.sqlite.create({
      name: this.database_name,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        this.sqliteObject = db;
        console.log('Database Created!');
        this.createTable();
      })
      .catch(e => {
        alert("error " + JSON.stringify(e))
      });
  }

  createTable() {
    this.sqliteObject.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.table_name} (
          id INTEGER PRIMARY KEY,
          latitude varchar(12),
          longitude varchar(12),
          created_at datetime
    )`, [])
      .then(() => {
        console.log('Table Created!');
        this.readTable(this.table_name);
      })
      .catch(e => {
        alert("error " + JSON.stringify(e))
      });
  }

  createRow(tableName: string, coordenates: Coordenates) {

    this.sqliteObject.executeSql(
      `INSERT INTO ${tableName}
         (latitude, longitude, created_at) 
          VALUES (
            '${coordenates.latitude}',
            '${coordenates.longitude}',
            '${coordenates.created_at}'
          )
    `, [])
      .then(() => {
        alert('Row Inserted!');
        this.readTable(tableName);
      })
      .catch(e => {
        alert("error " + JSON.stringify(e))
      });
  }


  // Retrieve rows from table
  readTable(tableName: string) {
    this.sqliteObject.executeSql(`
    SELECT * FROM ${tableName}
    `
      , [])
      .then((res) => {
        this.coordenatesList = [];
        if (res.rows.length > 0) {
          for (var i = 0; i < res.rows.length; i++) {

            this.coordenatesList.push(res.rows.item(i));
          }
        }
      })
      .catch(e => {
        alert("error " + JSON.stringify(e))
      });
  }

  truncate() {
    this.truncateTable(this.table_name);
  }

  truncateTable(tableName: string) {
    this.sqliteObject.executeSql(
      `DELETE FROM ${tableName} WHERE id > 0`
      , [])
      .then((res) => {
        alert(`Table ${tableName} Deleted!`);
        this.readTable(tableName);
      })
      .catch(e => {
        alert("error " + JSON.stringify(e))
      });
  }

  private getCoordenatesObjet(latitude: number, longitude: number,) {

    let coordenates = new Coordenates();
    coordenates.latitude = latitude;
    coordenates.longitude = longitude;
    coordenates.created_at = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

    return coordenates;
  }


  async checkGPS() {


    // this.diagnostic.isGpsLocationAvailable().then(successCallback, errorCallback);
    return this.diagnostic.getLocationMode()
      .then((state) => {
        if (state == this.diagnostic.locationMode.LOCATION_OFF) {
          alert('Location information is unavaliable on this device. Go to Settings to enable Location for Untapped.');
          return 0;

        } else {
          return 1;
        }
      }).catch(error => {
        alert(error);
        return 0;
      });

  }


  async getCurrentLocation() {

    if (await this.checkGPS()) {
      this.geolocation.getCurrentPosition().then((resp) => {
        this.createRow(this.table_name, this.getCoordenatesObjet(resp.coords.latitude, resp.coords.longitude));
      }).catch((error) => {
        alert('Error getting location' + error);
      });
    }

  }







}
