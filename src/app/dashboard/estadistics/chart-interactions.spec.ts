import { TestBed } from '@angular/core/testing';
import EstadisticsComponent from './estadistics.component';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../auth/auth-service/auth.service';

describe('Interacciones de las gráficas de Estadísticas', () => {
  it('permite desplazar la página sobre las cuatro gráficas sin cancelar eventos', async () => {
    TestBed.configureTestingModule({ providers: [
      { provide: DashboardService, useValue: {} },
      { provide: AuthService, useValue: { getCurrentUser: () => ({ role: 'Investigador' }), hasRole: () => false } },
    ] });
    // Se prueban las opciones del panel con el renderizador real, sin peticiones HTTP.
    const fixture = TestBed.createComponent(EstadisticsComponent);
    const component = fixture.componentInstance;
    const { default: ApexCharts } = await import('apexcharts');
    for (const options of [component.barChartOptions, component.stackedChartOptions, component.areaChartOptions, component.investigatorChartOptions]) {
      const host = document.createElement('div');
      host.style.cssText = 'width:640px;height:340px';
      document.body.appendChild(host);
      const chart = new ApexCharts(host, {
        ...options,
        series: options.series.map((series: { name: string }) => ({ ...series, data: [1, 2, 3] })),
        xaxis: { ...options.xaxis, categories: ['A', 'B', 'C'] },
        chart: { ...options.chart, animations: { enabled: false } },
      });
      try {
        await chart.render();
        const svg = host.querySelector('.apexcharts-svg')!;
        expect(svg).toBeTruthy();
        expect(host.querySelector('.apexcharts-zoom-rect')).toBeNull();
        const wheel = new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true });
        const preventWheel = spyOn(wheel, 'preventDefault').and.callThrough();
        svg.dispatchEvent(wheel);
        expect(preventWheel).not.toHaveBeenCalled();
        expect(wheel.defaultPrevented).toBeFalse();
        const touch = new Touch({ identifier: 1, target: svg, clientX: 100, clientY: 100 });
        for (const type of ['touchstart', 'touchmove', 'touchend']) {
          const event = new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [touch], changedTouches: [touch] });
          const preventTouch = spyOn(event, 'preventDefault').and.callThrough();
          svg.dispatchEvent(event);
          expect(preventTouch).not.toHaveBeenCalled();
        }
        expect(host.querySelector('.apexcharts-tooltip')).toBeTruthy();
      } finally {
        chart.destroy();
        host.remove();
      }
    }
  });
});
