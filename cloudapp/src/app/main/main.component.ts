import { Observable, of, Subscription } from 'rxjs';
import { finalize, tap, mergeMap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, Entity, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { MatRadioChange } from '@angular/material/radio';
import { AlmaApiService } from '../service/alma.api.service';
import { ClarivateApiService } from '../service/clarivate.api.service';
import { JCIRecord } from '../category-data-display/category-data-util';


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
  private yearParam : string = " &year=";

  records = new Array<any>();

  entities$: Observable<Entity[]> = this.eventsService.entities$.pipe(tap(() => this.clear()))

  constructor(
    private almaService: AlmaApiService,
    private clarivateServise : ClarivateApiService,
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService 
  ) { }

  ngOnInit() {
    this.pageLoad$ = this.eventsService.onPageLoad( pageInfo => {
      const entities = (pageInfo.entities||[]);
      if (entities.length > 0) {
        this.loading = true;
        this.getAllPageRecords(entities);
      }
      //this.loading = false;
    });  
  }

  getAllPageRecords(entities: any[]) {
    const mmsIds = entities.map(entity => entity.id);
    this.almaService.getBibsDetailsByMmsId(mmsIds).pipe(
      mergeMap(records => {
        // For the first loading.
        // The application loads the records in two steps:
        // The first -> load the records with the basic data (title only).
        // The second -> load the records with all the data we retrieve from clarivate.
        this.records = records;
        return of(this.records);
      }),mergeMap(records => {
        return this.clarivateServise.getSearchResultsFromClarivate(records);
      })
    ).subscribe({
      next: (response) => {
        let newrecords = new Array<JCIRecord>();
        response.jcrEntities.forEach(record => {
          newrecords.push(this.generateJciRecord(record));
        });
            this.records = newrecords;
      },
      error: e => {
        this.loading = false;
        console.log(e.message);
      },
      complete: () => {  
        this.loading = false;
      }
    });
  }

  generateJciRecord(record) : JCIRecord {
    let jciRecord = new JCIRecord();
    jciRecord.ID = record.issn;
    jciRecord.title = record.title;
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
}