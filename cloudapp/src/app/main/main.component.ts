import { Observable, of, Subscription  } from 'rxjs';
import { finalize, tap, mergeMap, catchError } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, Request, HttpMethod,  EntityType,
  Entity, RestErrorResponse, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { MatRadioChange } from '@angular/material/radio';
import { AlmaApiService, AlmaBibRecord } from '../service/alma.api.service';
import { ClarivateApiService } from '../service/clarivate.api.service';

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
  bibs: any[] = [];
  almaBibs: AlmaBibRecord[] = [];
  private _url: string;


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
        this.loading = true;
        this.almaBibs = this.getBibs(entities);
      }
      this.loading = false;
    });  


    
  }

  getBibs(entities: any[]) {
    let bibs: any[] = [];
    entities.forEach(bib => {
      let almaBib : AlmaBibRecord = new AlmaBibRecord();
        this.almaService.getBibDetailsByMmsId(bib.id).pipe(
            mergeMap(b => {      
                almaBib.mmsId = b.mms_id;
                almaBib.issn = b.issn;
                almaBib.description = b.title;
                return of(almaBib);
              }),
              catchError(()=>{
                console.log("error");
                return of(almaBib);
              }),
              mergeMap(almaBib => {
                  if(almaBib.issn !== null && almaBib.issn !== undefined) {
                    return this.clarivateServise.getSearchResultsFromClarivate(almaBib.issn);
                  }
                  return of();
              })
        ).subscribe({
            next : (almaBib) => {
                bibs.push(almaBib);
            }
        })
    })
    return bibs;
}

//   getBibs(entities: any[]) {
//     let bibs: any[] = [];
//     entities.forEach(bib => {
//       let almaBib : AlmaBibRecord = new AlmaBibRecord();
//         this.almaService.getBibDetailsByMmsId(bib.id).pipe(
//             mergeMap(b => {      
//                 almaBib.mmsId = b.mms_id;
//                 almaBib.issn = b.issn;
//                 almaBib.description = b.title;
//                 return of(almaBib);
//               }),
//               catchError(()=>{
//                 console.log("error");
//                 return of(almaBib);
//               }),
//               mergeMap(almaBib => {
//                   if(almaBib.issn !== null && almaBib.issn !== undefined) {
//                     return of(this.clarivateServise.getJCIInformation(almaBib.issn));
//                   }
//                   return of();
//               })
//         ).subscribe({
//             next : (almaBib) => {
//                 bibs.push(almaBib);
//             }
//         })
//     })
//     return bibs;
// }

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


    // getBibs(entities: any[]) {
    //   entities.forEach(bib => {
    //       this.almaService.getBibDetailsByMmsId(bib.id).pipe(
    //         mergeMap(b => {
    //           let almaBib : AlmaBibRecord = new AlmaBibRecord();
    //           almaBib.mmsId = b.mms_id;
    //           almaBib.issn = b.issn;
    //           almaBib.description = b.title;
    //           return of(almaBib);
    //         }),
    //         catchError(()=>{
    //           console.log("error");
    //           return of();
    //         })).subscribe({
    //           next : (almaBib) => {
    //             this.almaBibs.push(almaBib);
    //           }
    //         })
    //     })
    // }

  // getBibs() {
  //   this.entities$.pipe(
  //     mergeMap(entities => { 
  //       entities.forEach(bib => {
  //         this.almaService.getBibDetailsByMmsId(bib.id).pipe(
  //           mergeMap(b => {
  //             let almaBib : AlmaBibRecord = new AlmaBibRecord();
  //             almaBib.mmsId = b.mms_id;
  //             almaBib.issn = b.issn;
  //             almaBib.description = b.title;
  //             return of(almaBib);
  //           }),
  //           catchError(()=>{
  //             console.log("error");
  //             return of();
  //           })).subscribe({
  //             next : (almaBib) => {
  //               this.almaBibs.push(almaBib);
  //             }
  //           })
  //       })
  //       return of(this.bibs)
  //     }),
  //     catchError(()=>{
  //       console.log("error");
  //       return of();
  //     })
  //   ).subscribe({
  //     next: () => {
  //       return this.bibs;
  //     } 
  //   })
    
    
  //  return this.bibs;
    
  // }
}