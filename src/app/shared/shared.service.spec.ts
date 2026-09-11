import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { SharedService } from './shared.service';

describe('Service: Shared', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SharedService, provideHttpClient(), provideHttpClientTesting()]
    });
  });

  it('should ...', inject([SharedService], (service: SharedService) => {
    expect(service).toBeTruthy();
  }));
});
