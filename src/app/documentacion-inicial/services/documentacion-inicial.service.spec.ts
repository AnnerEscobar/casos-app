import { TestBed } from '@angular/core/testing';

import { DocumentacionInicialService } from './documentacion-inicial.service';

describe('DocumentacionInicialService', () => {
  let service: DocumentacionInicialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentacionInicialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
