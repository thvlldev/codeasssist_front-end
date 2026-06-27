import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhePublicacao } from './detalhe-publicacao';

describe('DetalhePublicacao', () => {
  let component: DetalhePublicacao;
  let fixture: ComponentFixture<DetalhePublicacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalhePublicacao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalhePublicacao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
