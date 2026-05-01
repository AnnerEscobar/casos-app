import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ConflictoService } from '../../services/conflicto.service';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { InformeService } from '../../../informes/services/informe.service';

@Component({
  selector: 'app-add-case-conflicto',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule, MatSelectModule, ReactiveFormsModule,
    MatSlideToggleModule, MatInputModule, MatIconModule,
    MatButtonModule, MatDatepickerModule, CommonModule,
    FormsModule, MatProgressSpinnerModule, MatCardModule, MatProgressBarModule
  ],
  templateUrl: './add-case-conflicto.component.html',
  styleUrl: './add-case-conflicto.component.css'
})
export default class AddCaseConflictoComponent implements OnInit {

  private formBuider = inject(FormBuilder);
  private conflictoService = inject(ConflictoService);
  private informeService = inject(InformeService);
  private _snackBar = inject(MatSnackBar);
  private router = inject(Router);

  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
  ];

  isLoading = false;
  fileName: string | null = null;
  selectedFile: File | null = null;
  informeDeic: string | null = null;
  casoYaExiste = false;
  deicDuplicado = '';

  myForm = this.formBuider.group({
    numeroDeic: ['', [Validators.required]],
    numeroMp: ['', [Validators.required]],
    estadoInvestigacion: ['', [Validators.required]],
    infractores: this.formBuider.array([]),
    victimas: this.formBuider.array([]),
    fileUrls: this.formBuider.array([]),
  });

  get infractores(): FormArray<FormGroup> {
    return this.myForm.get('infractores') as FormArray;
  }

  get victimas(): FormArray<FormGroup> {
    return this.myForm.get('victimas') as FormArray;
  }

  ngOnInit(): void {
    this.agregarInfractor();
    this.agregarVictima();

    const datos = history.state;

    if (datos?.informe) {
      const inf = datos.informe;
      this.informeDeic = inf.numeroDeic;

      this.myForm.patchValue({
        numeroDeic: inf.numeroDeic,
        numeroMp: inf.numeroMp,
      });

      const s = inf.perfilSecundario || {};
      (this.infractores.at(0) as FormGroup).patchValue({
        nombre: s.nombre || '',
        cui: s.cui || s.documentoIdentificacion || '',
        fecha_Nac: s.fechaNacimiento ? new Date(s.fechaNacimiento) : null,
        direccion: s.residencia || '',
      });

      const v = inf.perfilVictima || {};
      (this.victimas.at(0) as FormGroup).patchValue({
        nombre: v.nombre || '',
        fecha_Nac: v.fechaNacimiento ? new Date(v.fechaNacimiento) : null,
        direccion: v.residencia || '',
        cui: '',
      });

    } else if (datos?.numeroDeic) {
      this.myForm.patchValue({
        numeroDeic: datos.numeroDeic,
        numeroMp: datos.numeroMp,
      });
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

  agregarInfractor() {
    this.infractores.push(this.formBuider.group({
      nombre: ['', Validators.required],
      cui: ['', Validators.required],
      fecha_Nac: ['', Validators.required],
      direccion: ['', Validators.required],
    }));
  }

  eliminarInfractor(index: number) {
    this.infractores.removeAt(index);
  }

  agregarVictima() {
    this.victimas.push(this.formBuider.group({
      nombre: ['', Validators.required],
      fecha_Nac: ['', Validators.required],
      direccion: ['', Validators.required],
      cui: ['', Validators.required],
    }));
  }

  eliminarVictima(index: number) {
    this.victimas.removeAt(index);
  }

  registrarCaso() {
    if (!this.myForm.valid || !this.selectedFile) {
      this._snackBar.open('Debes completar todos los campos y seleccionar un archivo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('numeroDeic', this.myForm.value.numeroDeic?.trim() || '');
    formData.append('numeroMp', this.myForm.value.numeroMp?.trim() || '');
    formData.append('estadoInvestigacion', this.myForm.value.estadoInvestigacion || '');

    this.myForm.value.infractores?.forEach((inf: any, i: number) => {
      formData.append(`infractores[${i}][nombre]`, inf.nombre);
      formData.append(`infractores[${i}][cui]`, inf.cui);
      formData.append(`infractores[${i}][fecha_Nac]`, inf.fecha_Nac);
      formData.append(`infractores[${i}][direccion]`, inf.direccion);
    });

    this.myForm.value.victimas?.forEach((vic: any, i: number) => {
      formData.append(`victimas[${i}][nombre]`, vic.nombre);
      formData.append(`victimas[${i}][fecha_Nac]`, vic.fecha_Nac);
      formData.append(`victimas[${i}][direccion]`, vic.direccion);
      formData.append(`victimas[${i}][cui]`, vic.cui);
    });

    formData.append('file', this.selectedFile);

    this.conflictoService.registrarConflicto(formData).subscribe({
      next: () => {
        if (this.informeDeic) {
          this.informeService.eliminar(this.informeDeic).subscribe();
        }
        this._snackBar.open('Caso registrado con éxito', 'Cerrar', { duration: 3000 });
        this.resetFormState(this.myForm);
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
          this._snackBar.open('Error al registrar el caso', 'Cerrar', { duration: 3500 });
        }
      }
    });
  }

  irASeguimiento() {
    this.router.navigate(['/casos/seguimiento-conflicto'], {
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
}
