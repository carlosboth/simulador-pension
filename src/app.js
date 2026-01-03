import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SimuladorPensionIMSS = () => {
  const UMA_2025 = 113.14;
  const [fechaNacimiento, setFechaNacimiento] = useState('1973-10-07');
  const [semanasActuales, setSemanasActuales] = useState(539);
  const [fechaUltimaCotizacion, setFechaUltimaCotizacion] = useState('2025-12-22');
  const [salarioUMAs, setSalarioUMAs] = useState(25);
  const [edadRetiro, setEdadRetiro] = useState(65);
  const [resultados, setResultados] = useState(null);
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [datosComparacion, setDatosComparacion] = useState([]);
  const [mostrarComparacion, setMostrarComparacion] = useState(false);

  const calcularEdadActual = () => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const calcularFechaJubilacion = (edad) => {
    const nacimiento = new Date(fechaNacimiento);
    const fechaJub = new Date(nacimiento);
    fechaJub.setFullYear(nacimiento.getFullYear() + edad);
    return fechaJub;
  };

  const calcularFechaAlcanzarSemanas = (semanasObjetivo) => {
    const ultimaCot = new Date(fechaUltimaCotizacion);
    const semanasRestantes = semanasObjetivo - semanasActuales;
    const diasRestantes = semanasRestantes * 7;
    const fechaObjetivo = new Date(ultimaCot);
    fechaObjetivo.setDate(ultimaCot.getDate() + diasRestantes);
    return fechaObjetivo;
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearFechaCorta = (fecha) => {
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calcularPorcentajePorSemanas = (semanas) => {
    if (semanas < 500) return 0;
    const semanasExtra = semanas - 500;
    const incrementos = Math.floor(semanasExtra / 52);
    const porcentaje = 53 + (incrementos * 2.125);
    return Math.min(porcentaje, 100);
  };

  const calcularFactorEdad = (edad) => {
    if (edad >= 65) return 1.0;
    if (edad === 64) return 0.90;
    if (edad === 63) return 0.85;
    if (edad === 62) return 0.80;
    if (edad === 61) return 0.75;
    if (edad === 60) return 0.75;
    return 0.75;
  };

  const calcularCostoModalidad40 = (anio) => {
    const tasas = {
      2025: 0.13347,
      2026: 0.14438,
      2027: 0.15529,
      2028: 0.16620,
      2029: 0.17711,
      2030: 0.18800
    };
    const salarioDiario = UMA_2025 * salarioUMAs;
    const salarioMensual = salarioDiario * 30.4;
    const tasa = tasas[anio] || 0.18800;
    return salarioMensual * tasa;
  };

  const generarComparacionEdades = () => {
    const edadActual = calcularEdadActual();
    const edadesComparar = [60, 62, 63, 64, 65, 67, 70];
    const salarioDiario = UMA_2025 * salarioUMAs;
    const salarioMensual = salarioDiario * 30.4;
    
    const comparaciones = edadesComparar.map(edad => {
      const aniosHasta = edad - edadActual;
      const semanasTotal = semanasActuales + (aniosHasta * 52);
      const fechaJub = calcularFechaJubilacion(edad);
      const pctSemanas = calcularPorcentajePorSemanas(semanasTotal);
      const factorEdad = calcularFactorEdad(edad);
      const pensionMensual = salarioMensual * (pctSemanas / 100) * factorEdad;
      
      const aniosAntesJubilacion = Math.max(0, edad - 65);
      const pensionPerdida65 = aniosAntesJubilacion > 0 ? 
        (salarioMensual * (calcularPorcentajePorSemanas(semanasActuales + ((65 - edadActual) * 52)) / 100) * 1.0) : 
        0;
      const totalPerdido = pensionPerdida65 * 12 * aniosAntesJubilacion;
      
      const pension65 = salarioMensual * (calcularPorcentajePorSemanas(semanasActuales + ((65 - edadActual) * 52)) / 100) * 1.0;
      const diferenciaMensual = pensionMensual - pension65;
      
      const mesesRecuperacion = diferenciaMensual > 0 && totalPerdido > 0 ? 
        totalPerdido / diferenciaMensual : 
        0;
      
      const aniosProyeccion = 20;
      let beneficioAcumulado = 0;
      
      if (edad <= 65) {
        beneficioAcumulado = pensionMensual * 12 * aniosProyeccion;
      } else {
        const pensionNoRecibida = pension65 * 12 * (edad - 65);
        const pensionRecibida = pensionMensual * 12 * aniosProyeccion;
        beneficioAcumulado = pensionRecibida - pensionNoRecibida;
      }
      
      return {
        edad,
        fechaJubilacion: formatearFechaCorta(fechaJub),
        semanas: semanasTotal,
        pctSemanas: pctSemanas.toFixed(1),
        factorEdad: (factorEdad * 100).toFixed(0),
        pensionMensual,
        totalPerdido,
        diferenciaMensual,
        mesesRecuperacion,
        aniosRecuperacion: mesesRecuperacion / 12,
        beneficioAcumulado,
        esOptimo: edad === 65
      };
    });
    
    setDatosComparacion(comparaciones);
  };

  const calcularPension = () => {
    const edadActual = calcularEdadActual();
    const aniosParaRetiro = edadRetiro - edadActual;
    const semanasAlRetiro = semanasActuales + (aniosParaRetiro * 52);
    const fechaJubilacionCalculada = calcularFechaJubilacion(edadRetiro);
    const fechaAlcanza1000 = calcularFechaAlcanzarSemanas(1000);
    const fechaAlcanza1250 = calcularFechaAlcanzarSemanas(1250);
    const fechaAlcanza1500 = calcularFechaAlcanzarSemanas(1500);
    
    const salarioDiario = UMA_2025 * salarioUMAs;
    const salarioMensual = salarioDiario * 30.4;
    
    const porcentajeSemanas = calcularPorcentajePorSemanas(semanasAlRetiro);
    const factorEdad = calcularFactorEdad(edadRetiro);
    const pensionMensual = salarioMensual * (porcentajeSemanas / 100) * factorEdad;
    
    const aniosModalidad40 = Math.min(5, aniosParaRetiro);
    let costoTotal5Anos = 0;
    const anioInicio = 2025 + Math.max(0, aniosParaRetiro - 5);
    
    for (let i = 0; i < aniosModalidad40; i++) {
      const anio = anioInicio + i;
      const costoMensual = calcularCostoModalidad40(anio);
      costoTotal5Anos += costoMensual * 12;
    }

    const mesesRecuperacion = costoTotal5Anos / pensionMensual;
    const aniosRecuperacion = mesesRecuperacion / 12;

    setResultados({
      edadActual,
      semanasAlRetiro,
      fechaJubilacion: formatearFecha(fechaJubilacionCalculada),
      fechaJubilacionCorta: formatearFechaCorta(fechaJubilacionCalculada),
      fechaAlcanza1000: semanasActuales < 1000 ? formatearFechaCorta(fechaAlcanza1000) : null,
      fechaAlcanza1250: semanasActuales < 1250 ? formatearFechaCorta(fechaAlcanza1250) : null,
      fechaAlcanza1500: semanasActuales < 1500 ? formatearFechaCorta(fechaAlcanza1500) : null,
      salarioMensual,
      porcentajeSemanas,
      factorEdad: factorEdad * 100,
      pensionMensual,
      costoTotal5Anos,
      aniosRecuperacion,
      costoMensualPromedio: costoTotal5Anos / (aniosModalidad40 * 12)
    });

    const datos = [];
    for (let edad = 60; edad <= 70; edad++) {
      const semanas = semanasActuales + ((edad - edadActual) * 52);
      const pct = calcularPorcentajePorSemanas(semanas);
      const factor = calcularFactorEdad(edad);
      const pension = salarioMensual * (pct / 100) * factor;
      
      datos.push({
        edad,
        pension: Math.round(pension),
        semanas
      });
    }
    setDatosGrafica(datos);
  };

  useEffect(() => {
    calcularPension();
    generarComparacionEdades();
  }, [fechaNacimiento, semanasActuales, fechaUltimaCotizacion, salarioUMAs, edadRetiro]);

  const formatMoney = (num) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-2 text-indigo-900">
        Simulador de Pensión IMSS - Ley 73
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Calcula tu pensión estimada con Modalidad 40
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800">Datos Actuales</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            {fechaNacimiento && (
              <p className="text-xs text-gray-500 mt-1">
                Edad actual: {calcularEdadActual()} años
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semanas Cotizadas Actualmente
            </label>
            <input
              type="number"
              value={semanasActuales}
              onChange={(e) => setSemanasActuales(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de última cotización
            </label>
            <input
              type="date"
              value={fechaUltimaCotizacion}
              onChange={(e) => setFechaUltimaCotizacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Fecha en que alcanzaste las {semanasActuales} semanas
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800">Proyección</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salario de Cotización (UMAs: {salarioUMAs})
            </label>
            <input
              type="range"
              min="1"
              max="25"
              value={salarioUMAs}
              onChange={(e) => setSalarioUMAs(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              Salario: {formatMoney(UMA_2025 * salarioUMAs * 30.4)} mensuales
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edad de Retiro (años)
            </label>
            <input
              type="number"
              min="60"
              max="70"
              value={edadRetiro}
              onChange={(e) => setEdadRetiro(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {resultados && (
        <>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-2xl font-bold mb-2 text-center">📅 Tu Fecha de Jubilación</h2>
            <p className="text-center text-3xl font-bold mb-2">{resultados.fechaJubilacionCorta}</p>
            <p className="text-center text-sm opacity-90">{resultados.fechaJubilacion}</p>
          </div>

          {(resultados.fechaAlcanza1000 || resultados.fechaAlcanza1250 || resultados.fechaAlcanza1500) && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-3 text-indigo-800">🎯 Fechas Importantes: Alcanzarás...</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resultados.fechaAlcanza1000 && (
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600">1,000 semanas</p>
                    <p className="text-lg font-bold text-blue-900">{resultados.fechaAlcanza1000}</p>
                    <p className="text-xs text-gray-500 mt-1">~75% de pensión</p>
                  </div>
                )}
                {resultados.fechaAlcanza1250 && (
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">1,250 semanas</p>
                    <p className="text-lg font-bold text-green-900">{resultados.fechaAlcanza1250}</p>
                    <p className="text-xs text-gray-500 mt-1">~85% de pensión</p>
                  </div>
                )}
                {resultados.fechaAlcanza1500 && (
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600">1,500 semanas</p>
                    <p className="text-lg font-bold text-purple-900">{resultados.fechaAlcanza1500}</p>
                    <p className="text-xs text-gray-500 mt-1">~95% de pensión</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-800">Resultados de tu Pensión</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Semanas al Retiro</p>
                <p className="text-2xl font-bold text-indigo-900">{resultados.semanasAlRetiro}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">% por Semanas</p>
                <p className="text-2xl font-bold text-green-900">{resultados.porcentajeSemanas.toFixed(1)}%</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Factor de Edad</p>
                <p className="text-2xl font-bold text-blue-900">{resultados.factorEdad.toFixed(0)}%</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Pensión Mensual</p>
                <p className="text-2xl font-bold text-purple-900">{formatMoney(resultados.pensionMensual)}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-indigo-800">Inversión en Modalidad 40</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Costo Total 5 Años</p>
                  <p className="text-xl font-bold text-orange-900">{formatMoney(resultados.costoTotal5Anos)}</p>
                </div>
                
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Pago Mensual Promedio</p>
                  <p className="text-xl font-bold text-teal-900">{formatMoney(resultados.costoMensualPromedio)}</p>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Recuperación</p>
                  <p className="text-xl font-bold text-pink-900">{resultados.aniosRecuperacion.toFixed(1)} años</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <p className="text-sm text-gray-700">
                <strong>Interpretación:</strong> Recibirás {formatMoney(resultados.pensionMensual)} mensuales, 
                que representa el {(resultados.porcentajeSemanas * resultados.factorEdad / 100).toFixed(1)}% 
                de tu salario promedio de {formatMoney(resultados.salarioMensual)}. 
                Recuperarás tu inversión en aproximadamente {resultados.aniosRecuperacion.toFixed(1)} años.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMostrarComparacion(!mostrarComparacion)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              {mostrarComparacion ? '🔼 Ocultar' : '📊 Ver'} Análisis Comparativo por Edad de Retiro
            </button>
          </div>

          {mostrarComparacion && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4 text-indigo-800">
                💡 Análisis Comparativo: ¿A qué edad te conviene jubilarte?
              </h2>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">
                  <strong>Importante:</strong> Este análisis compara el beneficio total acumulado en 20 años 
                  considerando las pensiones que dejarías de recibir si te jubilas después de los 65 años. 
                  El factor de edad NO aumenta después de los 65 años (se mantiene en 100%).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="p-3 text-left">Edad</th>
                      <th className="p-3 text-left">Fecha Jubilación</th>
                      <th className="p-3 text-center">Semanas</th>
                      <th className="p-3 text-center">% Semanas</th>
                      <th className="p-3 text-center">Factor Edad</th>
                      <th className="p-3 text-right">Pensión Mensual</th>
                      <th className="p-3 text-right">Diferencia vs 65</th>
                      <th className="p-3 text-center">Veredicto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosComparacion.map((dato, idx) => (
                      <tr 
                        key={idx}
                        className={`border-b ${dato.esOptimo ? 'bg-green-50 font-semibold' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-3">
                          {dato.edad} años {dato.esOptimo && '⭐'}
                        </td>
                        <td className="p-3 text-left text-xs">{dato.fechaJubilacion}</td>
                        <td className="p-3 text-center">{dato.semanas}</td>
                        <td className="p-3 text-center">{dato.pctSemanas}%</td>
                        <td className="p-3 text-center">{dato.factorEdad}%</td>
                        <td className="p-3 text-right font-semibold">
                          {formatMoney(dato.pensionMensual)}
                        </td>
                        <td className={`p-3 text-right ${dato.diferenciaMensual > 0 ? 'text-green-600' : dato.diferenciaMensual < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {dato.diferenciaMensual !== 0 ? formatMoney(dato.diferenciaMensual) : '-'}
                        </td>
                        <td className="p-3 text-center text-xs">
                          {dato.edad < 65 && dato.factorEdad < 100 && (
                            <span className="text-orange-600">Descuento por edad</span>
                          )}
                          {dato.edad === 65 && (
                            <span className="text-green-600 font-bold">✓ ÓPTIMO</span>
                          )}
                          {dato.edad > 65 && dato.aniosRecuperacion > 0 && (
                            <span className="text-red-600">
                              Recuperas en {dato.aniosRecuperacion.toFixed(0)} años
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Recomendación</h3>
                  <p className="text-sm text-gray-700">
                    <strong>Júbilate a los 65 años.</strong> Es el punto óptimo porque:
                  </p>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4">
                    <li>• Factor de edad al 100% (sin descuentos)</li>
                    <li>• Maximiza el beneficio acumulado</li>
                    <li>• No pierdes años de pensión</li>
                    <li>• Disfrutas tu retiro 5+ años antes</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <h3 className="font-semibold text-red-900 mb-2">⚠️ Trabajar después de 65</h3>
                  <p className="text-sm text-gray-700">
                    Cada año adicional después de los 65:
                  </p>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4">
                    <li>• El factor de edad YA NO aumenta (tope 100%)</li>
                    <li>• Pierdes 12 meses de pensión</li>
                    <li>• Tardarías décadas en recuperar</li>
                    <li>• Solo aumenta ligeramente por más semanas</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-800">
              Pensión según Edad de Retiro
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="edad" 
                  label={{ value: 'Edad de Retiro', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Pensión Mensual (MXN)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => formatMoney(value)}
                  labelFormatter={(label) => `Edad: ${label} años`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pension" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  name="Pensión Mensual"
                  dot={{ fill: '#4f46e5', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <p><strong>Nota:</strong> Este simulador es una herramienta estimativa. Los cálculos están basados en la Ley del Seguro Social de 1973 y valores de UMA 2025 ($113.14). Para información precisa y personalizada, consulta con un asesor de pensiones o directamente con el IMSS.</p>
      </div>
    </div>
  );
};

export default SimuladorPensionIMSS;