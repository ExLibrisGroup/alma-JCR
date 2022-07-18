import { Component, Input, OnInit } from '@angular/core';
import { JCIRecord } from './category-data-util';

@Component({
  selector: 'category-data-display',
  templateUrl: './category-data-display.component.html',
  styleUrls: ['./category-data-display.component.scss']
})
export class CategoryDataDisplayComponent implements OnInit {

  @Input() record: JCIRecord;
  @Input() index: number;
  constructor() { }

  ngOnInit(): void {
  }

}
