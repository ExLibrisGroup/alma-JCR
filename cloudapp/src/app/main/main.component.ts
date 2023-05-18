import { Observable, Subscription } from 'rxjs';
import { tap, mergeMap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, Entity, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { AlmaApiService } from '../service/alma.api.service';
import { ClarivateApiService } from '../service/clarivate.api.service';
import { JCIRecord } from '../category-data-display/category-data-util';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { InCitesApiService } from '../service/InCites.api.service';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private pageLoad$: Subscription;

  loading = false;
  selectedEntity: Entity;
  apiResult: any;
  private baseUrl : string = "https://jcr.clarivate.com/jcr-jp/journal-profile?journal=";
  private yearParam : string = "&year=";
  private OkStatus: string = 'OK';
  private izRecordsParam : string = 'mms_id';
  private nzRecordsParam : string = 'proxy_nz_mms_id';
  private czRecordsParam : string = 'proxy_cz_mms_id';

  public isSlideChecked: boolean = false;
  public isIncitesEnabled : boolean = false;

  records = new Array<any>();

  entities$: Observable<Entity[]> = this.eventsService.entities$.pipe(tap(() => this.clear()))

  constructor(
    private almaService: AlmaApiService,
    private clarivateServise : ClarivateApiService,
    private inCitesApiService : InCitesApiService,
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService
  ) { }

  ngOnInit() {
    this.inCitesApiService.isIncitesFeatureEnable().subscribe({
      next : (response) => {
        if(!this.isEmpty(response)) {
          this.isIncitesEnabled = response.featureEnable;
          this.isSlideChecked = response.optin;
        }
      },
      error :(err) => {
          console.log("Failed to get The FF from the server " + err);
      },
    });
    this.pageLoad$ = this.eventsService.onPageLoad( pageInfo => {
      const entities = (pageInfo.entities||[]);
      if (entities.length > 0) {
        // For the first loading.
        // The application loads the records in two steps:
        // The first -> load the records with the basic data (title only).
        // The second -> load the records with all the data we retrieve from clarivate.
        let jcrRecords = new Array<JCIRecord>();
        entities.forEach(record =>{
          let jciRecord = new JCIRecord();
          jciRecord.title = record.description;
          jcrRecords.push(jciRecord);
        })
        this.records = jcrRecords;
        this.loading = true;
        this.getAllPageRecords(entities);
      }
    });  
   
  }

  isFeatureEnable() {
    return this.isIncitesEnabled;
  }

  getAllPageRecords(entities: any[]) {
    this.alert.clear();
    //Get the scope - it's needed for the query param
    const queryParam = this.getQueryParamByScope(entities[0].link);
    const mmsIds = entities.map(entity => entity.id);
  
    this.almaService.getBibsDetailsByMmsId(mmsIds, queryParam).pipe(
      mergeMap(records => {
        return this.clarivateServise.getSearchResultsFromClarivate(records.bib);
      })
    ).subscribe({
      next: (response) => {
        if(response.status === this.OkStatus) {
          let jcrRecords = new Array<JCIRecord>();
          response.jcrEntities?.forEach((record, index) => {
          //Take the title from the entity. the description contains the full record title
          //(the authority - if exists, for example)
          jcrRecords.push(this.generateJciRecord(record, entities[index]?.description));
        });
            this.records = jcrRecords;
        } else {
          this.alert.error(response.errorMessage); 

        } 
      },
      error: e => {
        this.loading = false;
        console.log(e.message);
        this.alert.error(e.message); 

      },
      complete: () => {  
        this.loading = false;
      }
    });
  }

  generateJciRecord(record, title) : JCIRecord {
    let jciRecord = new JCIRecord();
    jciRecord.ID = record.issn;
    jciRecord.title = title;
    if(!this.isEmpty(record.jcrInfo)) {
      jciRecord.available = true;
      jciRecord.year = record.jcrInfo.year;
      jciRecord.jci = record.jcrInfo.metrics.impactMetrics.jci;
      jciRecord.jurnalURL = this.generateJurnalURL(record.jurnalType, jciRecord.year);
      jciRecord.categoryDataArray = record.jcrInfo.ranks.jci;
    }
    return jciRecord;
}

  isEmpty(obj: any) {
    if(obj === undefined || obj === null || obj === "") {
      return true;
    } else {
      return false;
    } 
  }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
  }

  generateJurnalURL(jurnalType: string, year : number) : string {
    if(this.isEmpty(jurnalType)) {
      console.log("");
      return "";
    }
    return this.baseUrl + jurnalType + this.yearParam + year;

  }

  toggleChanges($event: MatSlideToggleChange) {
    this.inCitesApiService.connectToInCites($event.checked).subscribe({
      next: (response) => {
        if(response.status === this.OkStatus) {
          console.log("success");
        } else {
          this.alert.error(response.errorMessage); 
          $event.checked = !$event.checked;
        } 
      },
      error: e => {
        this.loading = false;
        console.log(e.message);
        this.alert.error(e.message); 
      },
      complete: () => {  
        this.loading = false;
      }
    });
  }

  getQueryParamByScope(link : string) {
    if(link.toUpperCase().includes('CZ')) {
      return this.czRecordsParam;
    }
    else if(link.toUpperCase().includes('NZ')) {
      return this.nzRecordsParam;
    }
    return this.izRecordsParam;
  }
}

export enum Scope {
  IZ = "IZ",
  NZ = "NZ",
  CZ = "CZ",
}