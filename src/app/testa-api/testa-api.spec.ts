import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestaApi } from './testa-api';

describe('TestaApi', () => {
  let component: TestaApi;
  let fixture: ComponentFixture<TestaApi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestaApi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestaApi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
