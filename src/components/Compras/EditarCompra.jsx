const handleEdit = async () => {
  try {
    setLoading(true);
    
    // Convertir el estado a formato numérico si es necesario
    const estadoNumerico = typeof compraForm.estado === 'string' 
      ? (compraForm.estado === 'APROBADO' ? 2 : 1)
      : compraForm.estado;
    
    // Validaciones
    if (!compraForm.id_proveedor) {
      Swal.fire('Error', 'Debe seleccionar un proveedor', 'error');
      setLoading(false);
      return;
    }
    
    if (!compraForm.numeroFactura) {
      Swal.fire('Error', 'Debe ingresar un número de factura', 'error');
      setLoading(false);
      return;
    }
    
    // Formatear los datos
    const compraEditada = {
      id_proveedor: compraForm.id_proveedor,
      id_estado: estadoNumerico,
      numeroFactura: compraForm.numeroFactura,
      fecha: compraForm.fecha,
      tipoPago: compraForm.tipoPago,
      estado: compraForm.estado,
      observaciones: compraForm.observaciones || '',
      detalles: compraForm.detalles
    };
    
    console.log('Datos a enviar:', compraEditada);
    
    // Intentar actualizar la compra usando el servicio mejorado
    const resultado = await comprasService.updateCompra(compra.id_compras, compraEditada);
    
    if (resultado) {
      Swal.fire({
        title: 'Compra actualizada',
        text: 'La compra se ha actualizado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Actualizar el estado local en lugar de recargar
      onClose();
      
      // Llamar onUpdate si existe
      if (typeof onUpdate === 'function') {
        onUpdate();
      }
    } else {
      throw new Error('No se pudo actualizar la compra');
    }
  } catch (error) {
    console.error('Error al editar compra:', error);
    Swal.fire({
      title: 'Error',
      text: `Error al actualizar la compra: ${error.message}`,
      icon: 'error'
    });
  } finally {
    setLoading(false);
  }
}; 