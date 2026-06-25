import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertaService } from '../../services/alerta.service';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { InformeService } from '../../../informes/services/informe.service';

@Component({
  selector: 'app-add-case-alerta',
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, MatButtonModule, MatDatepickerModule,
    MatFormFieldModule, MatIconModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, ReactiveFormsModule,
    MatProgressSpinnerModule, MatCardModule
  ],
  templateUrl: './add-case-alerta.component.html',
  styleUrl: './add-case-alerta.component.css'
})
export default class AddCaseAlertaComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);
  private alertaService = inject(AlertaService);
  private informeService = inject(InformeService);
  private router = inject(Router);

  isLoading = false;
  fileName: string | null = null;
  selectedFile: File | null = null;
  informeDeic: string | null = null;
  casoYaExiste = false;
  deicDuplicado = '';
  private readonly draftKey = 'draft:add-case-alerta';

  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
    { value: 'Remitido', viewValue: 'Remitido' },
  ];

  origenesAlerta = [
    { value: 'Casa hogar', viewValue: 'Casa hogar' },
    { value: 'Constatacion PGN', viewValue: 'Constatacion PGN' },
    { value: 'Desaparicion del hogar', viewValue: 'Desaparicion del hogar' },
    { value: 'Otro', viewValue: 'Otro' },
  ];

  casasHogar = [
    'Diamante I',
    'Diamante II',
    'Diamante III',
    'Diamante IV',
    'Diamante V',
    'Zafiro I',
    'Zafiro II',
    'Zafiro III',
    'Zafiro IV',
    'Zafiro V',
  ];

  myForm = this.formBuilder.group({
    numeroDeic: ['', [Validators.required, Validators.pattern(/^DEIC52-\d{4}-\d{2}-\d{2}-\d+$/)]],
    numeroMp: ['', [Validators.required, Validators.pattern(/^M0030-\d{4}-\d+$/)]],
    numeroAlerta: ['', [Validators.required, Validators.pattern(/^\d+-\d{4}$/)]],
    nombreDesaparecido: ['', [Validators.required]],
    fecha_Nac: [null, [Validators.required]],
    estadoInvestigacion: ['', [Validators.required]],
    origenAlerta: [''],
    casaHogar: [''],
    ubicacionGps: [''],
    direccion: this.formBuilder.group({
      departamento: ['', [Validators.required]],
      municipio: ['', [Validators.required]],
      direccionDetallada: ['', [Validators.required]],
    }),
    direccionLocalizacion: [''],
    nombreAcompanante: [''],
    telefono: [''],
    horaLocalizacion: [''],
    fechaLocalizacion: [null],
    fileUrls: this.formBuilder.array([]),
  });

  ngOnInit() {
    this.myForm.get('estadoInvestigacion')?.valueChanges.subscribe((estado) => {
      const mostrar = estado === 'Remitido';
      const campos = ['direccionLocalizacion', 'nombreAcompanante', 'telefono', 'horaLocalizacion', 'fechaLocalizacion'];
      campos.forEach(campo => {
        const control = this.myForm.get(campo);
        if (mostrar) {
          control?.setValidators(Validators.required);
          control?.updateValueAndValidity();
        } else {
          control?.clearValidators();
          control?.setValue('');
          control?.updateValueAndValidity();
        }
      });
    });

    this.myForm.get('origenAlerta')?.valueChanges.subscribe((origen) => {
      const casaHogarControl = this.myForm.get('casaHogar');
      if (origen === 'Casa hogar') {
        casaHogarControl?.setValidators(Validators.required);
      } else {
        casaHogarControl?.clearValidators();
        casaHogarControl?.setValue('');
      }
      casaHogarControl?.updateValueAndValidity();
    });

    const datos = history.state;

    if (datos?.informe) {
      const inf = datos.informe;
      this.informeDeic = inf.numeroDeic;
      const v = inf.perfilVictima || {};
      const dg = inf.datosGenerales || {};

      this.myForm.patchValue({
        numeroDeic: inf.numeroDeic,
        numeroMp: inf.numeroMp,
        numeroAlerta: dg.numeroAlerta || '',
        nombreDesaparecido: v.nombre || '',
        fecha_Nac: v.fechaNacimiento ? new Date(v.fechaNacimiento) as any : null,
      });

    } else if (datos?.numeroDeic) {
      this.myForm.patchValue({
        numeroDeic: datos.numeroDeic,
        numeroMp: datos.numeroMp,
        numeroAlerta: datos.numeroAlerta,
        nombreDesaparecido: datos.nombre,
        fecha_Nac: datos.fecha_Nac,
        direccion: {
          departamento: datos.departamento || '',
          municipio: datos.municipio || '',
          direccionDetallada: datos.lugar || ''
        }
      });
    } else {
      this.restaurarBorradorLocal();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
    } else {
      this.selectedFile = null;
      this.fileName = null;
    }
  }

  registrarCaso() {
    if (this.myForm.invalid || !this.selectedFile) {
      this._snackBar.open('Debes completar todos los campos y seleccionar un archivo', 'Cerrar', { duration: 3000, panelClass: ['snack-warning'] });
      return;
    }

    this.guardarBorradorLocal();
    this.isLoading = true;
    const formData = new FormData();
    formData.append('numeroDeic', this.myForm.value.numeroDeic || '');
    formData.append('numeroMp', this.myForm.value.numeroMp || '');
    formData.append('numeroAlerta', this.myForm.value.numeroAlerta || '');
    formData.append('nombreDesaparecido', this.myForm.value.nombreDesaparecido || '');
    formData.append('fecha_Nac', this.myForm.value.fecha_Nac || '');
    formData.append('estadoInvestigacion', this.myForm.value.estadoInvestigacion || '');
    formData.append('origenAlerta', this.myForm.value.origenAlerta || '');
    formData.append('casaHogar', this.myForm.value.casaHogar || '');
    formData.append('ubicacionGps', this.myForm.value.ubicacionGps || '');
    formData.append('direccion[departamento]', this.myForm.value.direccion?.departamento || '');
    formData.append('direccion[municipio]', this.myForm.value.direccion?.municipio || '');
    formData.append('direccion[direccionDetallada]', this.myForm.value.direccion?.direccionDetallada || '');
    formData.append('file', this.selectedFile);

    if (this.myForm.value.estadoInvestigacion === 'Remitido') {
      formData.append('direccionLocalizacion', this.myForm.value.direccionLocalizacion || '');
      formData.append('nombreAcompanante', this.myForm.value.nombreAcompanante || '');
      formData.append('telefono', this.myForm.value.telefono || '');
      formData.append('horaLocalizacion', this.myForm.value.horaLocalizacion || '');
      formData.append('fechaLocalizacion', this.myForm.value.fechaLocalizacion || '');
    }

    this.alertaService.registrarAlerta(formData).subscribe({
      next: () => {
        if (this.informeDeic) {
          this.informeService.eliminar(this.informeDeic).subscribe();
        }
        this._snackBar.open('Caso registrado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snack-success'] });
        this.resetFormState(this.myForm);
        sessionStorage.removeItem(this.draftKey);
        this.selectedFile = null;
        this.isLoading = false;
        this.informeDeic = null;
      },
      error: (error) => {
        this.isLoading = false;
        const msg: string = error?.error?.message || '';
        if (msg.toLowerCase().includes('exist')) {
          this.deicDuplicado = this.myForm.value.numeroDeic || '';
          this.casoYaExiste = true;
        } else {
          this._snackBar.open('Error al registrar el caso', 'Cerrar', { duration: 3000, panelClass: ['snack-error'] });
        }
      }
    });
  }

  irASeguimiento() {
    this.router.navigate(['/casos/seguimiento-alerta'], {
      state: { numeroDeic: this.deicDuplicado }
    });
  }

  resetFormState(form: FormGroup) {
    form.reset();
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormGroup) {
        this.resetFormState(control);
      } else {
        control?.markAsPristine();
        control?.markAsUntouched();
        control?.setErrors(null);
      }
    });
  }

  private guardarBorradorLocal(): void {
    sessionStorage.setItem(this.draftKey, JSON.stringify({
      value: this.myForm.getRawValue(),
      fileName: this.fileName,
    }));
  }

  private restaurarBorradorLocal(): void {
    const raw = sessionStorage.getItem(this.draftKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      const value = draft.value || {};
      if (value.fecha_Nac) value.fecha_Nac = new Date(value.fecha_Nac);
      if (value.fechaLocalizacion) value.fechaLocalizacion = new Date(value.fechaLocalizacion);

      this.myForm.patchValue(value);
      this.fileName = draft.fileName ? `${draft.fileName} (selecciona el archivo nuevamente)` : null;
      this._snackBar.open('Recupere un borrador local. Revisa los datos y selecciona el archivo nuevamente.', 'Cerrar', {
        duration: 5000,
        panelClass: ['snack-warning']
      });
    } catch {
      sessionStorage.removeItem(this.draftKey);
    }
  }
}
