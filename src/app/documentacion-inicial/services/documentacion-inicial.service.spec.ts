import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DocumentacionInicialService } from './documentacion-inicial.service';

describe('DocumentacionInicialService', () => {
  let service: DocumentacionInicialService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DocumentacionInicialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
