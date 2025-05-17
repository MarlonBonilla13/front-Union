// Agregar configuración compartida para todas las alertas
const alertConfig = {
  customClass: {
    container: 'swal-container-highest',
    popup: 'swal-popup-highest'
  }
};

const handleEdit = async () => {
  try {
    setLoading(true);
    
    // Validaciones
    if (!compraForm.id_proveedor) {
      Swal.fire({
        title: 'Error',
        text: 'Debe seleccionar un proveedor',
        icon: 'error',
        ...alertConfig
      });
      setLoading(false);
      return;
    }
    
    if (!compraForm.numeroFactura) {
      Swal.fire({
        title: 'Error',
        text: 'Debe ingresar un número de factura',
        icon: 'error',
        ...alertConfig
      });
      setLoading(false);
      return;
    }
    
    // Simplificar los datos a enviar - solo enviar lo que realmente cambiará
    const compraEditada = {
      estado_pago: compraForm.estado || 'PENDIENTE',
      observaciones: compraForm.observaciones || ''
    };
    
    // Si hay detalles, incluirlos en el formato correcto
    if (compraForm.detalles && compraForm.detalles.length > 0) {
      compraEditada.detalles = compraForm.detalles.map(detalle => ({
        id_material: parseInt(detalle.idMaterial || detalle.id_material),
        cantidad: parseFloat(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precioUnitario || detalle.precio_unitario),
        descuento: parseFloat(detalle.descuento || 0)
      }));
    }
    
    console.log('Datos a enviar:', compraEditada);
    
    // Intentar actualizar la compra usando el servicio mejorado
    const resultado = await comprasService.updateCompra(compra.id_compras, compraEditada);
    
    if (resultado) {
      Swal.fire({
        title: 'Compra actualizada',
        text: 'La compra se ha actualizado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        ...alertConfig
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
      icon: 'error',
      ...alertConfig
    });
  } finally {
    setLoading(false);
  }
}; 