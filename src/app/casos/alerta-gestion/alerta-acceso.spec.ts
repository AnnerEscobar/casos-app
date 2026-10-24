import { firstValueFrom, filter, take } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { routes } from '../../app.routes';
import { AuthService } from '../../auth/auth-service/auth.service';
import { UserRole } from '../../auth/enums/user-role.enum';

describe('Acceso real a registro de casos',()=>{
 for(const tipo of ['alerta','maltrato','conflicto']){
  for(const role of [UserRole.ANALISTA,UserRole.INVESTIGADOR]){
    it(`abre el formulario al pulsar Registrar ${tipo} como ${role}`,async()=>{
      const route=routes.find(r=>r.path==='casos')!.children!.find(r=>r.path==='add-case-'+tipo)!;
      const selector=routes.find(r=>r.path==='casos')!.children!.find(r=>r.path==='registrar')!;
      TestBed.configureTestingModule({providers:[
        provideRouter([{...selector,path:'casos/registrar'},{...route,path:'casos/add-case-'+tipo}]),provideHttpClient(),provideHttpClientTesting(),provideNoopAnimations(),
        {provide:AuthService,useValue:{getCurrentUser:()=>({role}),hasRole:(r:UserRole)=>r===role}},
      ]});
      const harness=await RouterTestingHarness.create();
      await harness.navigateByUrl('/casos/registrar');
      const enlace=harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a.case-card.'+tipo)!;
      expect(enlace.getAttribute('href')).toBe('/casos/add-case-'+tipo);
      const navegacion = firstValueFrom(TestBed.inject(Router).events.pipe(
        filter(e => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError), take(1)));
      enlace.querySelector<HTMLElement>('.case-action span')!.click();
      expect(await navegacion).toBeInstanceOf(NavigationEnd);
      expect(TestBed.inject(Router).url).toBe('/casos/add-case-'+tipo);
      harness.detectChanges();
      const http=TestBed.inject(HttpTestingController);
      http.match(()=>true).forEach(req=>req.flush([]));
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain(tipo==='alerta'?(role===UserRole.ANALISTA?'Registrar Alerta Alba-Keneth':'Alertas asignadas'):(role===UserRole.ANALISTA?'Registrar caso de '+tipo:'Casos de '+tipo+' asignados'));
      await harness.fixture.whenStable();
      http.verify();
    }, 15000); // Incluye la primera importación lazy y compilación de formularios extensos.
  }
 }
});

