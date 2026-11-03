import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';
import { AuthService } from '../auth-service/auth.service';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { UserRole } from '../enums/user-role.enum';
import AuthComponent from '../pages/login/auth.component';
import { FormBuilder } from '@angular/forms';

describe('Cambio obligatorio de contraseña',()=>{
  let auth:any,router:Router;
  beforeEach(()=>{
    auth={checkSession:()=>of({user:{debeCambiarPassword:true}}),getCurrentUser:()=>({role:UserRole.INVESTIGADOR,debeCambiarPassword:true})};
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:auth}]});router=TestBed.inject(Router);
  });
  async function comprobar(url:string){return firstValueFrom(TestBed.runInInjectionContext(()=>authGuard({} as any,{url} as any)) as any);}
  it('redirige cualquier pantalla protegida y permite abrir el formulario de cambio',async()=>{
    expect(router.serializeUrl(await comprobar('/casos') as UrlTree)).toBe('/change-password');expect(await comprobar('/change-password')).toBe(true);
    const resultado=TestBed.runInInjectionContext(()=>roleGuard({data:{roles:[UserRole.INVESTIGADOR]}} as any,{} as any));expect(router.serializeUrl(resultado as UrlTree)).toBe('/change-password');
  });
  it('conserva el acceso habitual para cuentas que ya cambiaron su contraseña',async()=>{
    auth.checkSession=()=>of({user:{debeCambiarPassword:false}});expect(await comprobar('/casos')).toBe(true);
  });
  it('acepta usuario nombre.apellido además de correos en el formulario de inicio',()=>{
    const componente=new AuthComponent(new FormBuilder(),auth,router,{snapshot:{queryParamMap:{get:()=>null}}} as any);
    componente.loginForm.setValue({email:'anner.escobar',password:'anner2026'});expect(componente.loginForm.valid).toBeTrue();
    componente.loginForm.patchValue({email:'anner@institucion.gt'});expect(componente.loginForm.valid).toBeTrue();
  });
});
