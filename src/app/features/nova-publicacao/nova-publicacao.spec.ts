import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaPublicacao } from './nova-publicacao';

describe('NovaPublicacao', () => {
  let component: NovaPublicacao;
  let fixture: ComponentFixture<NovaPublicacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaPublicacao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovaPublicacao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
