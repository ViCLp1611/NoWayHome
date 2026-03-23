import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

// Datos mock de arrendatarios
const mockArrendatarios = [
  { id: 1, nombre: 'María González' },
  { id: 2, nombre: 'Ana Martínez' },
  { id: 3, nombre: 'Roberto Díaz' },
  { id: 4, nombre: 'Sofia López' },
  { id: 5, nombre: 'Carlos Ramírez' },
];

export function PropertyForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    id_arrendatario: '',
    descripcion: '',
    direccion: '',
    precio: '',
    estado: '',
    resena: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error cuando se modifica el campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.id_arrendatario) newErrors.id_arrendatario = 'Seleccione un arrendatario';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';
    if (!formData.precio || isNaN(formData.precio) || formData.precio <= 0) newErrors.precio = 'Ingrese un precio válido';
    if (!formData.estado) newErrors.estado = 'Seleccione un estado';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const property = {
        id: Date.now().toString(), // ID único temporal
        id_arrendatario: parseInt(formData.id_arrendatario),
        descripcion: formData.descripcion.trim(),
        direccion: formData.direccion.trim(),
        precio: parseFloat(formData.precio),
        estado: formData.estado,
        resena: formData.resena.trim(),
        fecha_creacion: new Date().toISOString(),
      };

      console.log('Nueva propiedad creada:', property);

      // Aquí se podría llamar a una función para guardar en el backend
      if (onSubmit) {
        onSubmit(property);
      }

      // Resetear formulario y cerrar
      setFormData({
        id_arrendatario: '',
        descripcion: '',
        direccion: '',
        precio: '',
        estado: '',
        resena: '',
      });
      setErrors({});
      if (onClose) onClose();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
          Registrar Nueva Propiedad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Arrendatario */}
          <div className="space-y-2">
            <Label htmlFor="id_arrendatario" className="text-[#5F5F5F] font-medium">
              Arrendatario *
            </Label>
            <Select
              value={formData.id_arrendatario}
              onValueChange={(value) => handleChange('id_arrendatario', value)}
            >
              <SelectTrigger className="bg-[#FAFAFA] border-gray-200">
                <SelectValue placeholder="Seleccione un arrendatario" />
              </SelectTrigger>
              <SelectContent>
                {mockArrendatarios.map((arrendatario) => (
                  <SelectItem key={arrendatario.id} value={arrendatario.id.toString()}>
                    {arrendatario.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_arrendatario && (
              <p className="text-red-500 text-sm">{errors.id_arrendatario}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-[#5F5F5F] font-medium">
              Descripción *
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Describa la propiedad..."
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              className="bg-[#FAFAFA] border-gray-200 min-h-[100px]"
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm">{errors.descripcion}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-[#5F5F5F] font-medium">
              Dirección *
            </Label>
            <Input
              id="direccion"
              type="text"
              placeholder="Dirección completa de la propiedad"
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              className="bg-[#FAFAFA] border-gray-200"
            />
            {errors.direccion && (
              <p className="text-red-500 text-sm">{errors.direccion}</p>
            )}
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <Label htmlFor="precio" className="text-[#5F5F5F] font-medium">
              Precio por noche *
            </Label>
            <Input
              id="precio"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => handleChange('precio', e.target.value)}
              className="bg-[#FAFAFA] border-gray-200"
            />
            {errors.precio && (
              <p className="text-red-500 text-sm">{errors.precio}</p>
            )}
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado" className="text-[#5F5F5F] font-medium">
              Estado *
            </Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => handleChange('estado', value)}
            >
              <SelectTrigger className="bg-[#FAFAFA] border-gray-200">
                <SelectValue placeholder="Seleccione el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="ocupado">Ocupado</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && (
              <p className="text-red-500 text-sm">{errors.estado}</p>
            )}
          </div>

          {/* Reseña */}
          <div className="space-y-2">
            <Label htmlFor="resena" className="text-[#5F5F5F] font-medium">
              Reseña (opcional)
            </Label>
            <Textarea
              id="resena"
              placeholder="Agregue una reseña o comentarios adicionales..."
              value={formData.resena}
              onChange={(e) => handleChange('resena', e.target.value)}
              className="bg-[#FAFAFA] border-gray-200 min-h-[80px]"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#6B8E23] hover:bg-[#5a7a1d] text-white"
            >
              Crear Propiedad
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}