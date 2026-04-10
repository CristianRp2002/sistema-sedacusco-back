import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class PdfService implements OnModuleDestroy {

  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser) {
      try {
        await this.browser.pages();
        if (!this.browser.connected) throw new Error('disconnected');
      } catch {
        this.browser = null;
      }
    }

    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
        ]
      });

      this.browser.on('disconnected', () => {
        this.browser = null;
      });
    }

    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      try { await this.browser.close(); } catch {}
      this.browser = null;
    }
  }

  async generarPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      await page.evaluate(() => new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(null);
        } else {
          window.addEventListener('load', () => resolve(null));
        }
      }));

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
        displayHeaderFooter: false,
      });
      return Buffer.from(pdf);
    } finally {
      try { await page.close(); } catch {}
    }
  }

  generarHtmlParte(parte: any): string {
    const v = (val: any, suffix = '') => val != null && val !== '' ? `${val}${suffix}` : '—';

    const formatHora = (fecha: string) => {
      if (!fecha) return '—';
      try {
        return new Date(fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
        return fecha || '—';
      }
    };

    const formatFecha = (fecha: string) => {
      if (!fecha) return '—';
      try {
        return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
      } catch {
        return fecha || '—';
      }
    };

    const fecha = formatFecha(parte.fecha_folio);
    const fechaCorta = new Date(parte.fecha_folio).toLocaleDateString('es-PE');
    const estacion = (parte.estacion?.nombre || '').toUpperCase();

    // ✅ BOMBAS
    const bombas: string[] = [...new Set<string>(
      (parte.detallesBombeo?.map((b: any) => b.bomba?.nombre as string) || [])
        .filter((nombre: any): nombre is string => !!nombre && nombre.trim() !== '')
    )];

    // ✅ OPERADORES
    const operadores: any[] = parte.operadores || [];
    const turnos = ['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO'];

    // ✅ VERIFICACIONES
    const verificacionesHab = parte.verificacionesTablero?.filter((vt: any) => vt.momento === 'HABILITACION') || [];
    const verificacionesDes = parte.verificacionesTablero?.filter((vt: any) => vt.momento === 'DESACTIVACION') || [];

    const produccion = Number(parte.produccion_calculada || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ✅ FIX 1: filasTableros — infiere nombre del tablero cuando viene null
    const filasTableros = (verifs: any[]) => {
      if (verifs.length === 0) {
        return `<tr><td colspan="6" class="center">Sin registros</td></tr>`;
      }
      return verifs.map((vf, i) => {
        const nombreTablero = vf.tablero?.nombre ||
          (i === 0 ? 'TABLERO GENERAL' : `TABLERO BOMBA ${i}`);
        return `
          <tr>
            <td>${nombreTablero}</td>
            <td class="center">${vf.interruptor_estado || '—'}</td>
            <td class="center">${vf.selector_estado || '—'}</td>
            <td class="center">${vf.parada_emergencia_estado || '—'}</td>
            <td class="center">${vf.variador_estado || '—'}</td>
            <td class="center">${vf.alarma_estado || '—'}</td>
          </tr>`;
      }).join('');
    };

    // ✅ ENCABEZADOS bombas
    const encabezadosBombas = bombas.map(b => `<th colspan="4">${b.toUpperCase()}</th>`).join('');
    const subEncabezadosBombas = bombas.map(() => `<th>Enc.</th><th>Apag.</th><th>Hor. I</th><th>Hor. F</th>`).join('');

    const getBombeos = (nombre: string) => {
      return parte.detallesBombeo?.filter((b: any) => b.bomba?.nombre === nombre) || [];
    };

    const maxFilas = Math.max(...bombas.map(b => getBombeos(b).length), 1);

    const filasBombas = Array.from({ length: maxFilas }, (_, i) => {
      const celdas = bombas.map(bomba => {
        const b = getBombeos(bomba)[i];
        return `
          <td class="center">${b ? formatHora(b.encendido) : '—'}</td>
          <td class="center">${b ? formatHora(b.apagado) : '—'}</td>
          <td class="right">${b ? (b.horometro_inicial ?? '—') : '—'}</td>
          <td class="right">${b ? (b.horometro_final ?? '—') : '—'}</td>`;
      }).join('');

      const obs = bombas.length > 0 && getBombeos(bombas[0])[i]
        ? (getBombeos(bombas[0])[i]?.observacion || '')
        : '';

      return `<tr>
        <td class="center num">${String(i + 1).padStart(2, '0')}</td>
        ${celdas}
        <td>${obs}</td>
      </tr>`;
    }).join('');

    // ✅ FIRMAS
    const firmasOperadores = operadores.map((op, i) => `
      <div class="firma-operador">
        <div class="turno-label">${turnos[i] || (i + 1) + '° TURNO'}</div>
        <div class="nombre-operador">${op.nombre_operador || ''}</div>
        <div class="linea-firma"></div>
      </div>`).join('');

    // ✅ FIX 2: Sección VII — registrosActivo (observaciones_generales eliminado)
    const activosConValores = (() => {
  const valores: any[] = parte.valoresRegistro || [];
  const mapa = new Map<string, { nombre: string; tipo: string; campos: any[] }>();
  
  valores.forEach((v: any) => {
    const activoId = v.activo_id;
    if (!mapa.has(activoId)) {
      mapa.set(activoId, {
        nombre: v.activo?.nombre || '—',
        tipo:   v.activo?.tipoActivo?.nombre || '—',
        campos: []
      });
    }
    mapa.get(activoId)!.campos.push({
      etiqueta: v.campo?.etiqueta || v.campo?.nombre_campo || '—',
      valor:    v.valor || '—',
      unidad:   v.campo?.unidad || ''
    });
  });
  
  return Array.from(mapa.values());
})();

const seccionRegistros = activosConValores.length > 0 ? `
  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto">
      <span class="seccion-num">VII.</span>
      <span class="seccion-titulo">REGISTRO DE EQUIPOS Y ACTIVOS</span>
    </div>
  </div>
  ${activosConValores.map(activo => `
    <div style="margin-bottom: 8px;">
      <div style="background:#F8FAFC; border:0.25px solid #D1D5DB; padding:5px 8px; font-weight:700; font-size:8pt; margin-bottom:0;">
        ${activo.nombre} <span style="font-weight:400; color:#64748B;">(${activo.tipo})</span>
      </div>
      <table>
        <thead>
          <tr>
            ${activo.campos.map((c: any) => `<th>${c.etiqueta}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${activo.campos.map((c: any) => `
              <td class="center">${c.valor}${c.unidad ? ' ' + c.unidad : ''}</td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `).join('')}
` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #0F172A; background: white; line-height: 1.4; }

  .header { background: linear-gradient(135deg, #1A56A0 0%, #0F2D5E 100%); padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; }
  .header-empresa { flex: 1; }
  .header-empresa h1 { font-size: 16pt; font-weight: 700; color: white; letter-spacing: -0.3px; }
  .header-empresa p { font-size: 7pt; color: #BFDBFE; margin-top: 3px; }
  .header-divider { width: 1px; height: 48px; background: rgba(255,255,255,0.2); margin: 0 20px; }
  .header-titulo { flex: 1; text-align: center; }
  .header-titulo h2 { font-size: 10pt; font-weight: 700; color: white; letter-spacing: 0.5px; }
  .header-titulo p { font-size: 8.5pt; color: #BFDBFE; margin-top: 5px; font-weight: 500; }
  .header-fecha { text-align: right; min-width: 90px; }
  .header-fecha .label { font-size: 6pt; color: #BFDBFE; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  .header-fecha .valor { font-size: 14pt; font-weight: 700; color: white; margin-top: 2px; }

  .seccion { display: flex; align-items: center; gap: 10px; margin: 14px 0 7px 0; page-break-inside: avoid; }
  .seccion-barra { width: 4px; height: 18px; background: #1A56A0; border-radius: 2px; flex-shrink: 0; }
  .seccion-texto { display: flex; align-items: center; gap: 5px; }
  .seccion-num { font-size: 8.5pt; font-weight: 700; color: #1E40AF; white-space: nowrap; }
  .seccion-titulo { font-size: 8.5pt; font-weight: 700; color: #0F172A; letter-spacing: 0.2px; }

  table { width: 100%; border-collapse: collapse; font-size: 8pt; page-break-inside: avoid; }
  th { background: #F8FAFC; color: #64748B; font-size: 6.5pt; font-weight: 600; text-align: center; padding: 6px 5px; border: 0.25px solid #D1D5DB; letter-spacing: 0.3px; text-transform: uppercase; }
  td { border: 0.25px solid #D1D5DB; padding: 7px 6px; color: #0F172A; font-size: 8pt; }
  tr:nth-child(even) td { background: #FAFAFA; }
  .center { text-align: center; }
  .right { text-align: right; }
  .num { color: #94A3B8; font-size: 7pt; }

  .td-produccion { background: #F0FDF4 !important; color: #15803D !important; font-size: 11pt !important; font-weight: 700 !important; text-align: right; border: 0.5px solid #BBF7D0 !important; padding: 6px 8px !important; }

  .panel-row { display: flex; gap: 10px; align-items: flex-start; page-break-inside: avoid; }
  .panel-tabla { flex: 1; }
  .panel-lateral { width: 88px; flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; }
  .panel-item { border: 0.25px solid #D1D5DB; }
  .panel-item-label { background: #F8FAFC; font-size: 6pt; font-weight: 600; color: #64748B; text-align: center; padding: 5px 4px; border-bottom: 0.25px solid #D1D5DB; text-transform: uppercase; letter-spacing: 0.3px; }
  .panel-item-valor { font-size: 9pt; font-weight: 600; color: #0F172A; text-align: center; padding: 9px 4px; }

  .firmas-divider { border: none; border-top: 0.25px solid #D1D5DB; margin: 20px 0 16px 0; page-break-inside: avoid; }
  .firmas-container { display: flex; gap: 32px; align-items: flex-start; page-break-inside: avoid; }
  .firmas-operadores { flex: 1; }
  .firmas-supervisor { width: 170px; flex-shrink: 0; }
  .firma-titulo { font-size: 7.5pt; font-weight: 700; color: #0F172A; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .firma-titulo-barra { width: 4px; height: 14px; background: #1A56A0; border-radius: 2px; flex-shrink: 0; }
  .firma-operador { margin-bottom: 10px; page-break-inside: avoid; }
  .turno-label { font-size: 6pt; font-weight: 700; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .nombre-operador { font-size: 9.5pt; font-weight: 500; color: #0F172A; margin-bottom: 4px; }
  .linea-firma { border-bottom: 0.25px solid #D1D5DB; width: 140px; margin-top: 3px; }
  .sup-label { font-size: 6.5pt; color: #64748B; margin-bottom: 3px; }
  .sup-linea { border-bottom: 0.25px solid #D1D5DB; margin-bottom: 16px; }

  .footer { margin-top: 24px; border-top: 0.25px solid #D1D5DB; padding-top: 5px; display: flex; justify-content: space-between; font-size: 6.5pt; color: #94A3B8; page-break-inside: avoid; }
</style>
</head>
<body>

  <div class="header">
    <div class="header-empresa">
      <h1>EPS SEDACUSCO S.A.</h1>
      <p>Sistema de Gestión de Bombeo</p>
    </div>
    <div class="header-divider"></div>
    <div class="header-titulo">
      <h2>SECUENCIA DIARIA DE OPERACIÓN</h2>
      <p>${estacion}</p>
    </div>
    <div class="header-divider"></div>
    <div class="header-fecha">
      <div class="label">Fecha</div>
      <div class="valor">${fechaCorta}</div>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto"><span class="seccion-num">I.</span><span class="seccion-titulo">INSPECCIÓN DEL SISTEMA DE PROTECCIÓN SUB ESTACIÓN</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">INTERRUPTOR DE<br>LLEGADA 10KV</th>
        <th rowspan="2">TRANSFORMADOR 400KVA</th>
        <th colspan="3">TENSIÓN DE LLEGADA (KV)</th>
        <th colspan="3">TENSIÓN TABLERO GENERAL (V)</th>
      </tr>
      <tr><th>R</th><th>S</th><th>T</th><th>R</th><th>S</th><th>T</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">${v(parte.interruptor_llegada_10kv_estado)}</td>
        <td class="center">${v(parte.transformador_temperatura, '°C')}</td>
        <td class="center">${v(parte.tension_llegada?.fase_R)}</td>
        <td class="center">${v(parte.tension_llegada?.fase_S)}</td>
        <td class="center">${v(parte.tension_llegada?.fase_T)}</td>
        <td class="center">${v(parte.tension_tablero?.fase_R)}</td>
        <td class="center">${v(parte.tension_tablero?.fase_S)}</td>
        <td class="center">${v(parte.tension_tablero?.fase_T)}</td>
      </tr>
    </tbody>
  </table>

  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto"><span class="seccion-num">II.</span><span class="seccion-titulo">HABILITACIÓN DE EQUIPOS SALA DE MANDOS</span></div>
  </div>
  <div class="panel-row">
    <div class="panel-tabla">
      <table>
        <thead>
          <tr><th>TABLERO</th><th>INTERRUPTOR</th><th>SELECTOR</th><th>PARADA EMERG.</th><th>VARIADOR</th><th>ALARMA</th></tr>
        </thead>
        <tbody>${filasTableros(verificacionesHab)}</tbody>
      </table>
    </div>
    <div class="panel-lateral">
      <div class="panel-item">
        <div class="panel-item-label">Telemetría</div>
        <div class="panel-item-valor">${v(parte.condicion_habilitacion?.estado_telemetria)}</div>
      </div>
      <div class="panel-item">
        <div class="panel-item-label">Presión Ingreso</div>
        <div class="panel-item-valor">${v(parte.condicion_habilitacion?.presion_ingreso, ' LTS')}</div>
      </div>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto"><span class="seccion-num">III.</span><span class="seccion-titulo">LECTURA INICIAL</span></div>
  </div>
  <table>
    <thead>
      <tr><th>HORA</th><th>NIVEL CISTERNA EB</th><th>PRESIÓN DE LÍNEA</th><th>TOTALIZADOR</th><th>PRESIÓN CISTERNA JATUN HUAYLLA</th><th>FOLIO</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">${v(parte.lectura_inicial?.hora_registro)}</td>
        <td class="center">${v(parte.lectura_inicial?.nivel_cisterna)}</td>
        <td class="center">${v(parte.lectura_inicial?.presion_linea)}</td>
        <td class="right">${v(parte.totalizador_inicial)}</td>
        <td class="center">${v(parte.lectura_inicial?.presion_jatun_huaylla)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto"><span class="seccion-num">IV.</span><span class="seccion-titulo">ENCENDIDO Y APAGADO DE BOMBAS</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">N°</th>
        ${encabezadosBombas}
        <th rowspan="2">OBS.</th>
      </tr>
      <tr>${subEncabezadosBombas}</tr>
    </thead>
    <tbody>${filasBombas}</tbody>
  </table>

  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto"><span class="seccion-num">V.</span><span class="seccion-titulo">LECTURA FINAL</span></div>
  </div>
  <table>
    <thead>
      <tr><th>HORA</th><th>NIVEL CISTERNA EB</th><th>PRESIÓN DE LÍNEA</th><th>TOTALIZADOR</th><th>PRESIÓN CISTERNA JATUN HUAYLLA</th><th>PRODUCCIÓN</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">${v(parte.lectura_final?.hora_registro)}</td>
        <td class="center">${v(parte.lectura_final?.nivel_cisterna)}</td>
        <td class="center">${v(parte.lectura_final?.presion_linea)}</td>
        <td class="right">${v(parte.totalizador_final)}</td>
        <td class="center">${v(parte.lectura_final?.presion_jatun_huaylla)}</td>
        <td class="td-produccion">${produccion} m³</td>
      </tr>
    </tbody>
  </table>

  <div class="seccion">
    <div class="seccion-barra"></div>
    <div class="seccion-texto"><span class="seccion-num">VI.</span><span class="seccion-titulo">DESACTIVACIÓN DE EQUIPOS</span></div>
  </div>
  <div class="panel-row">
    <div class="panel-tabla">
      <table>
        <thead>
          <tr><th>TABLERO</th><th>INTERRUPTOR</th><th>SELECTOR</th><th>PARADA EMERG.</th><th>VARIADOR</th><th>ALARMA</th></tr>
        </thead>
        <tbody>${filasTableros(verificacionesDes)}</tbody>
      </table>
    </div>
    <div class="panel-lateral">
      <div class="panel-item">
        <div class="panel-item-label">Telemetría</div>
        <div class="panel-item-valor">${v(parte.condicion_desactivacion?.estado_telemetria)}</div>
      </div>
      <div class="panel-item">
        <div class="panel-item-label">Presión Ingreso</div>
        <div class="panel-item-valor">${v(parte.condicion_desactivacion?.presion_ingreso, ' LTS')}</div>
      </div>
    </div>
  </div>

  ${seccionRegistros}

  <hr class="firmas-divider">
  <div class="firmas-container">
    <div class="firmas-operadores">
      <div class="firma-titulo"><div class="firma-titulo-barra"></div>OPERADORES DE TURNO</div>
      ${firmasOperadores}
    </div>
    <div class="firmas-supervisor">
      <div class="firma-titulo"><div class="firma-titulo-barra"></div>V° B° SUPERVISOR</div>
      <div class="sup-label">Nombre completo</div>
      <div class="sup-linea"></div>
      <div class="sup-label">Firma y sello</div>
      <div class="sup-linea"></div>
    </div>
  </div>

  <div class="footer">
    <span>EPS SEDACUSCO S.A. · Sistema de Gestión de Bombeo</span>
    <span>Documento generado el ${new Date().toLocaleDateString('es-PE')}</span>
  </div>

</body>
</html>`;
  }
}