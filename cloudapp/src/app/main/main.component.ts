import { Observable, of, Subscription, forkJoin  } from 'rxjs';
import { finalize, tap, mergeMap, catchError } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, HttpMethod,  EntityType,
  Entity, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { MatRadioChange } from '@angular/material/radio';
import { AlmaApiService, AlmaBibRecord } from '../service/alma.api.service';
import { ClarivateApiService } from '../service/clarivate.api.service';
import { JCIRecord, OKstatus } from '../category-data-display/category-data-util';


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
  private _url: string;
  private baseUrl : string = "https://jcr.clarivate.com/jcr-jp/journal-profile?journal=";
  private yearParam : string = " &year=";

  records = new Array<JCIRecord>();

  entities$: Observable<Entity[]> = this.eventsService.entities$
  .pipe(tap(() => this.clear()))

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
       this.getAllPageRecords(entities);
      }
    });  
  }

  setLoadingRecords(records) {
        let bibs = new Array<JCIRecord>();
        records.forEach(element => {
          let jci = new JCIRecord();
          jci.title = element.description
          bibs.push(jci)
        });
        this.records = bibs;
  }

  getAllPageRecords(entities: any[]) {
    this.loading = true;
    // forkJoin run the function inside on each entity seperatly
    // the map function make the entity order to be saved during the running 
    const mmsIds = entities.map(entity => entity.id);
    return this.almaService.getBibDetailsByMmsId(entities.map(entity => entity.id)).pipe(
      mergeMap(records => {
        this.setLoadingRecords(records);
        return of();
      }),
     
    )
    .subscribe({
      next: (records: any[]) => {
            this.records = records;
          },
          error: (e) => {
            console.log(e);
          },
          complete: () => {
            this.loading = false;
          }
        });
    
    }

    
    // forkJoin(entities.map(entity => this.getRecord(entity)))
    // .subscribe({
    //   next: (records: any[]) => {
    //         this.records = records;
    //       },
    //       error: (e) => {
    //         console.log(e);
    //       },
    //       complete: () => {
    //         this.loading = false;
    //         this.resultsTemplateFactory();
    //       }
    //     });
    // }

  getRecord(entity): Observable<JCIRecord> {
    let jciRecord = new JCIRecord();
    return this.almaService.getBibDetailsByMmsId(entity.id).pipe(
      mergeMap(responseRecord => {
        jciRecord.title = responseRecord.title;
        if(!this.isEmpty(responseRecord.issn)) {
          jciRecord.ID = responseRecord.issn;
          return this.clarivateServise.getSearchResultsFromClarivate(responseRecord.issn);
        } else {
          return of(jciRecord);
        }
      }),
      catchError(()=>{
        console.log("error in getting ISSN");
        jciRecord.available = false;
        jciRecord.title = entity.description;
        return of(jciRecord);
      }),
      mergeMap(response => {
        if(!this.isEmpty(response) && response.status === OKstatus) {
          jciRecord.available = true;
          jciRecord.year = response.jcrInfo.year;
          jciRecord.jci = response.jcrInfo.metrics.impactMetrics.jci;
          jciRecord.jurnalURL = this.generateJurnalURL(response.jurnalType, jciRecord.year);
          jciRecord.categoryDataArray = response.jcrInfo.ranks.jci;
        } else {
          console.log("There was a problem in the response from the Clarivate servers: \n" 
          + response.errorMessage);
        }
        return of(jciRecord);
      }),
      catchError(()=>{
        console.log("An error occurs while trying to connect to the Clarivate servers");
        jciRecord.available = false;
        return of(jciRecord);
      })
    )
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

  entitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.restService.call<any>(value.link)
    .pipe(finalize(()=>this.loading=false))
    .subscribe(
      result => this.apiResult = result,
      error => this.alert.error('Failed to retrieve entity: ' + error.message)
    );
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