import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InformeService } from '../services/informe.service';

@Component({
  selector: 'app-crear-informe',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatSelectModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule
  ],
  templateUrl: './crear-informe.component.html',
  styleUrl: './crear-informe.component.css'
})
export class CrearInformeComponent implements OnInit {

  // Estado general
  informe: any = null;
  cargando = false;
  guardando = false;
  error = '';

  // Paso inicial
  modoInicio = true;
  nuevoNumeroDeic = '';
  nuevoNumeroMp = '';
  nuevoNumeroAlerta = '';
  nuevoTipo = '';

  // Sección activa
  seccionActiva = 'datosGenerales';

  secciones = [
    { key: 'datosGenerales', label: 'Datos generales', icon: 'description' },
    { key: 'perfilVictima', label: 'Perfil de la víctima', icon: 'person' },
    { key: 'perfilSecundario', label: 'Perfil del sindicado/denunciante', icon: 'person_outline' },
    { key: 'entrevistas', label: 'Entrevistas', icon: 'record_voice_over' },
    { key: 'perfilacionLugar', label: 'Perfilación del lugar', icon: 'location_on' },
    { key: 'diligencias', label: 'Diligencias', icon: 'assignment' },
    { key: 'conclusiones', label: 'Conclusiones', icon: 'gavel' },
  ];

  // Datos de cada sección (editables)
  datosGenerales: any = {};
  perfilVictima: any = {};
  nuevaVictima: any = this.crearPerfilVictimaVacio();
  indiceVictimaEditando: number | null = null;
  perfilSecundario: any = {};
  nuevoPerfilSecundario: any = this.crearPerfilSecundarioVacio();
  indicePerfilSecundarioEditando: number | null = null;
  entrevistas: any = {};
  nuevaEntrevista: any = this.crearEntrevistaVacia();
  perfilacionLugar: any = {};
  diligencias: any = {};
  conclusiones: any = {};

  constructor(
    private informeService: InformeService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const deic = this.route.snapshot.queryParamMap.get('deic');
    if (deic) {
      this.modoInicio = false;
      this.cargarInforme(deic);
    }
  }

  get labelSecundario(): string {
    if (!this.informe) return 'Perfil del sindicado/denunciante';
    if (this.informe.tipoInforme === 'alerta') return 'Perfil del denunciante';
    if (this.informe.tipoInforme === 'maltrato') return 'Perfil del sindicado';
    return 'Perfil del adolescente infractor';
  }

  get seccionesAdaptadas() {
    return this.secciones
      .filter(s => !(['maltrato', 'conflicto'].includes(this.informe?.tipoInforme) && s.key === 'diligencias'))
      .map(s => s.key === 'perfilSecundario' ? { ...s, label: this.labelSecundario } : s);
  }

  seccionCompletada(key: string): boolean {
    return this.informe?.seccionesCompletadas?.includes(key) ?? false;
  }

  crearNuevoInforme() {
    this.error = '';

    if (!this.nuevoNumeroDeic || !this.nuevoNumeroMp || !this.nuevoTipo) {
      this.snackBar.open('Completa todos los campos para crear el informe.', 'Cerrar', { duration: 3000 });
      return;
    }

    const numeroDeic = this.nuevoNumeroDeic.trim().toUpperCase();
    const numeroAlerta = this.nuevoNumeroAlerta.trim();
    const formatoValido =
      (this.nuevoTipo === 'alerta' && numeroDeic.startsWith('DEIC52-')) ||
      (this.nuevoTipo === 'maltrato' && numeroDeic.startsWith('DEIC51-')) ||
      (this.nuevoTipo === 'conflicto' && numeroDeic.startsWith('DEIC53-'));

    if (!formatoValido) {
      this.error = 'El tipo de informe no coincide con el numero DEIC. Usa DEIC52 para alerta, DEIC51 para maltrato o DEIC53 para conflicto.';
      this.snackBar.open(
        this.error,
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }

    if (this.nuevoTipo === 'alerta' && !numeroAlerta) {
      this.snackBar.open('Ingresa el numero de Alerta Alba-Keneth.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando = true;
    this.informeService.crear({
      numeroDeic,
      numeroMp: this.nuevoNumeroMp,
      tipoInforme: this.nuevoTipo,
      datosGenerales: this.nuevoTipo === 'alerta' ? { numeroAlerta } : {}
    }).subscribe({
      next: (data) => {
        this.informe = data;
        this.cargarSecciones();
        this.modoInicio = false;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear el informe.';
        this.cargando = false;
      }
    });
  }

  cargarInforme(numeroDeic: string) {
    this.cargando = true;
    this.informeService.obtenerPorDeic(numeroDeic).subscribe({
      next: (data) => {
        this.informe = data;
        this.cargarSecciones();
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se encontró el informe.';
        this.cargando = false;
      }
    });
  }

  cargarSecciones() {
    this.datosGenerales = { ...this.informe.datosGenerales };
    this.perfilVictima = this.normalizarPerfilMultiple(this.informe.perfilVictima);
    this.perfilSecundario = this.normalizarPerfilMultiple(this.informe.perfilSecundario);
    this.nuevaVictima = this.crearPerfilVictimaVacio();
    this.nuevoPerfilSecundario = this.crearPerfilSecundarioVacio();
    this.entrevistas = this.normalizarEntrevistas(this.informe.entrevistas);
    this.perfilacionLugar = this.normalizarPerfilacionLugar(this.informe.perfilacionLugar);
    this.diligencias = { ...this.informe.diligencias };
    this.conclusiones = { ...this.informe.conclusiones };
  }

  seleccionarSeccion(key: string) {
    this.seccionActiva = key;
  }

  guardarSeccion() {
    if (this.seccionActiva === 'entrevistas' && !this.prepararEntrevistasParaGuardar()) {
      return;
    }
    if (this.seccionActiva === 'perfilVictima' && !this.prepararPerfilVictimaParaGuardar()) {
      return;
    }
    if (this.seccionActiva === 'perfilSecundario' && !this.prepararPerfilSecundarioParaGuardar()) {
      return;
    }

    this.guardando = true;
    const payload: any = {
      [this.seccionActiva]: (this as any)[this.seccionActiva],
      seccionesCompletadas: [this.seccionActiva]
    };

    this.informeService.actualizarSeccion(this.informe.numeroDeic, payload).subscribe({
      next: (data) => {
        this.informe = data;
        this.guardando = false;
        this.snackBar.open('Sección guardada correctamente.', 'OK', { duration: 2000 });
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar la sección.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  generarWord() {
    if (this.seccionActiva === 'entrevistas') {
      if (!this.prepararEntrevistasParaGuardar()) {
        return;
      }

      this.guardando = true;
      const payload = {
        entrevistas: this.entrevistas,
        seccionesCompletadas: ['entrevistas']
      };

      this.informeService.actualizarSeccion(this.informe.numeroDeic, payload).subscribe({
        next: (data) => {
          this.informe = data;
          this.guardando = false;
          this.informeService.descargarWord(this.informe.numeroDeic);
        },
        error: () => {
          this.guardando = false;
          this.snackBar.open('Error al guardar la entrevista antes de generar Word.', 'Cerrar', { duration: 3000 });
        }
      });
      return;
    }

    this.informeService.descargarWord(this.informe.numeroDeic);
  }

  enviarAPendientes() {
    this.informeService.marcarPendienteRegistro(this.informe.numeroDeic).subscribe({
      next: () => {
        this.snackBar.open('Informe enviado a pendientes de registro.', 'OK', { duration: 3000 });
        this.router.navigate(['/casos/pendientes-informe']);
      },
      error: () => {
        this.snackBar.open('Error al enviar a pendientes.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  agregarEntrevista() {
    if (!this.validarNuevaEntrevista()) {
      return;
    }

    this.entrevistas.items = [...(this.entrevistas.items || []), { ...this.nuevaEntrevista }];
    this.nuevaEntrevista = this.crearEntrevistaVacia();
  }

  eliminarEntrevista(index: number) {
    this.entrevistas.items = (this.entrevistas.items || []).filter((_: any, i: number) => i !== index);
  }

  agregarVictima() {
    if (!this.validarPerfil(this.nuevaVictima, 'victima')) return;
    const items = [...(this.perfilVictima.items || [])];
    if (this.indiceVictimaEditando !== null) {
      items[this.indiceVictimaEditando] = { ...this.nuevaVictima };
    } else {
      items.push({ ...this.nuevaVictima });
    }
    this.perfilVictima.items = items;
    this.indiceVictimaEditando = null;
    this.nuevaVictima = this.crearPerfilVictimaVacio();
  }

  editarVictima(index: number) {
    const item = this.perfilVictima.items?.[index];
    if (!item) return;
    this.nuevaVictima = { ...this.crearPerfilVictimaVacio(), ...item };
    this.indiceVictimaEditando = index;
  }

  cancelarEdicionVictima() {
    this.nuevaVictima = this.crearPerfilVictimaVacio();
    this.indiceVictimaEditando = null;
  }

  eliminarVictima(index: number) {
    this.perfilVictima.items = (this.perfilVictima.items || []).filter((_: any, i: number) => i !== index);
    if (this.indiceVictimaEditando === index) {
      this.cancelarEdicionVictima();
    }
  }

  agregarPerfilSecundario() {
    if (!this.validarPerfil(this.nuevoPerfilSecundario, this.labelSecundario.toLowerCase())) return;
    const items = [...(this.perfilSecundario.items || [])];
    if (this.indicePerfilSecundarioEditando !== null) {
      items[this.indicePerfilSecundarioEditando] = { ...this.nuevoPerfilSecundario };
    } else {
      items.push({ ...this.nuevoPerfilSecundario });
    }
    this.perfilSecundario.items = items;
    this.indicePerfilSecundarioEditando = null;
    this.nuevoPerfilSecundario = this.crearPerfilSecundarioVacio();
  }

  editarPerfilSecundario(index: number) {
    const item = this.perfilSecundario.items?.[index];
    if (!item) return;
    this.nuevoPerfilSecundario = { ...this.crearPerfilSecundarioVacio(), ...item };
    this.indicePerfilSecundarioEditando = index;
  }

  cancelarEdicionPerfilSecundario() {
    this.nuevoPerfilSecundario = this.crearPerfilSecundarioVacio();
    this.indicePerfilSecundarioEditando = null;
  }

  eliminarPerfilSecundario(index: number) {
    this.perfilSecundario.items = (this.perfilSecundario.items || []).filter((_: any, i: number) => i !== index);
    if (this.indicePerfilSecundarioEditando === index) {
      this.cancelarEdicionPerfilSecundario();
    }
  }

  esPerfilMultiple(): boolean {
    return this.informe?.tipoInforme === 'maltrato' || this.informe?.tipoInforme === 'conflicto';
  }

  private crearEntrevistaVacia() {
    return {
      titulo: '',
      persona: '',
      modalidad: 'telefonica',
      telefono: '',
      lugar: '',
      fecha: this.datosGenerales?.fechaDiligencias || this.datosGenerales?.fechaInforme || new Date(),
      hora: '',
      dpi: '',
      edad: '',
      calidadPersona: '',
      estadoCivil: '',
      ocupacion: '',
      vozAtendio: 'femenina',
      notaIdentificacion: '',
      contenido: '',
    };
  }

  private crearPerfilVictimaVacio() {
    return {
      nombre: '',
      alias: '',
      edad: '',
      fechaNacimiento: '',
      nacionalidad: '',
      caracteristicasFisicas: '',
      lugarTrabajo: '',
      escolaridad: '',
      centroEducativo: '',
      nombrePadres: '',
      residencia: '',
      telefono: '',
      parentescoSindicado: '',
      antecedentesProteccion: '',
      antecedentesAlerta: '',
      indicadoresMaltrato: '',
      hermanosmenores: '',
      estadoCivil: '',
      profesion: '',
      lugarEstudios: '',
      cui: '',
      pertenenciaEtnica: '',
      discapacidad: '',
      identidadGenero: '',
      redesSociales: '',
      flujoMigratorio: '',
      antecedentesPolicia: '',
      otraInfo: '',
    };
  }

  private crearPerfilSecundarioVacio() {
    return {
      nombre: '',
      alias: '',
      edad: '',
      fechaNacimiento: '',
      estadoCivil: '',
      profesion: '',
      lugarTrabajo: '',
      documentoIdentificacion: '',
      nacionalidad: '',
      caracteristicasFisicas: '',
      nombrePadres: '',
      residencia: '',
      telefono: '',
      referencias: '',
      parentescoVictima: '',
      antecedentesPolicia: '',
      cui: '',
      pertenenciaEtnica: '',
      discapacidad: '',
      identidadGenero: '',
      redesSociales: '',
      antecedentesProteccion: '',
      antecedentesAlerta: '',
      consumoDrogas: '',
      ingresoCentroPrivacion: '',
      parientesPrivados: '',
      flujoMigratorio: '',
      pandillas: '',
      parientesPandillas: '',
      tiempoPandilla: '',
      clica: '',
      rangoPandilla: '',
      areaOperacion: '',
      metodologiaCriminal: '',
      gradoViolencia: '',
      otraInfo: '',
    };
  }

  private normalizarPerfilMultiple(perfil: any) {
    if (!this.esPerfilMultiple()) return { ...(perfil || {}) };
    if (Array.isArray(perfil?.items)) return { ...perfil, items: perfil.items };
    const tieneDatos = this.tieneDatosPerfil(perfil || {});
    return { ...(perfil || {}), items: tieneDatos ? [{ ...(perfil || {}) }] : [] };
  }

  private normalizarEntrevistas(entrevistas: any) {
    if (Array.isArray(entrevistas?.items)) {
      return { ...entrevistas, items: entrevistas.items };
    }

    const items = [
      { titulo: 'Entrevista a padres o encargados', contenido: entrevistas?.padresEncargados },
      { titulo: this.informe?.tipoInforme === 'alerta' ? 'Entrevista a denunciante' : 'Entrevista a testigos', contenido: entrevistas?.denuncianteTestigos },
      { titulo: 'Entrevista a vecinos o posibles testigos', contenido: entrevistas?.vecinos },
      { titulo: 'Entrevista a la victima', contenido: entrevistas?.victima },
    ]
      .filter((item) => item.contenido)
      .map((item) => ({
        titulo: item.titulo,
        persona: '',
        modalidad: 'telefonica',
        telefono: '',
        lugar: '',
        fecha: this.datosGenerales?.fechaDiligencias || this.datosGenerales?.fechaInforme || new Date(),
        hora: '',
        dpi: '',
        edad: '',
        calidadPersona: '',
        estadoCivil: '',
        ocupacion: '',
        vozAtendio: 'femenina',
        notaIdentificacion: '',
        contenido: item.contenido,
      }));

    return { ...(entrevistas || {}), items };
  }

  private normalizarPerfilacionLugar(perfilacionLugar: any) {
    return {
      ...(perfilacionLugar || {}),
      fecha: perfilacionLugar?.fecha || this.datosGenerales?.fechaDiligencias || this.datosGenerales?.fechaInforme || new Date(),
      hora: perfilacionLugar?.hora || '',
      ubicacion: perfilacionLugar?.ubicacion || perfilacionLugar?.descripcion || '',
      municipioDepartamento: perfilacionLugar?.municipioDepartamento || '',
      contadorElectrico: perfilacionLugar?.contadorElectrico || '',
      documentarFotografias: perfilacionLugar?.documentarFotografias ?? true,
      coordenadasGps: perfilacionLugar?.coordenadasGps || '',
      camarasEstado: perfilacionLugar?.camarasEstado || (perfilacionLugar?.camaras ? 'hay' : 'no_ubicadas'),
      indicadoresEstado: perfilacionLugar?.indicadoresEstado || (perfilacionLugar?.indicadoresAmbientales ? 'hay' : 'no_ubicados'),
    };
  }

  private prepararEntrevistasParaGuardar(): boolean {
    if (!this.hayEntrevistaEnEdicion()) {
      return true;
    }

    if (!this.validarNuevaEntrevista()) {
      return false;
    }

    this.entrevistas.items = [...(this.entrevistas.items || []), { ...this.nuevaEntrevista }];
    this.nuevaEntrevista = this.crearEntrevistaVacia();
    return true;
  }

  private prepararPerfilVictimaParaGuardar(): boolean {
    if (!this.esPerfilMultiple() || !this.tieneDatosPerfil(this.nuevaVictima)) {
      return true;
    }
    if (!this.validarPerfil(this.nuevaVictima, 'victima')) return false;
    this.agregarVictima();
    return true;
  }

  private prepararPerfilSecundarioParaGuardar(): boolean {
    if (!this.esPerfilMultiple() || !this.tieneDatosPerfil(this.nuevoPerfilSecundario)) {
      return true;
    }
    if (!this.validarPerfil(this.nuevoPerfilSecundario, this.labelSecundario.toLowerCase())) return false;
    this.agregarPerfilSecundario();
    return true;
  }

  private tieneDatosPerfil(perfil: any): boolean {
    return Object.keys(perfil || {})
      .filter((key) => key !== 'items')
      .some((key) => `${perfil[key] || ''}`.trim());
  }

  private validarPerfil(perfil: any, etiqueta: string): boolean {
    if (!perfil.nombre) {
      this.snackBar.open(`Ingresa el nombre de la ${etiqueta}.`, 'Cerrar', { duration: 3000 });
      return false;
    }
    return true;
  }

  private hayEntrevistaEnEdicion(): boolean {
    const entrevista = this.nuevaEntrevista || {};
    return [
      entrevista.titulo,
      entrevista.persona,
      entrevista.telefono,
      entrevista.lugar,
      entrevista.hora,
      entrevista.dpi,
      entrevista.edad,
      entrevista.calidadPersona,
      entrevista.estadoCivil,
      entrevista.ocupacion,
      entrevista.notaIdentificacion,
      entrevista.contenido
    ].some((value) => `${value || ''}`.trim());
  }

  private validarNuevaEntrevista(): boolean {
    if (!this.nuevaEntrevista.titulo || !this.nuevaEntrevista.persona || !this.nuevaEntrevista.contenido) {
      this.snackBar.open('Indica titulo, persona entrevistada y contenido.', 'Cerrar', { duration: 3000 });
      return false;
    }

    return true;
  }
}
