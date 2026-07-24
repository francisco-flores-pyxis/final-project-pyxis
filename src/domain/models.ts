/**
 * Modelos de dominio de VetLab.
 *
 * Responsabilidades:
 * - Definir el contrato tipado de entidades (Owner, Pet, Vet, Service, Appointment).
 * - Exponer tipos derivados para UI y mock API (Slot, AppointmentView, inputs).
 *
 * Dependencias: ninguna (capa más interna).
 * Relación: consumido por `data/`, `hooks/`, `views/` y `components/`.
 *
 * Decisión: ids como string e ISO strings porque el lab es client-only (sin ORM).
 */

export type Especie = "perro" | "gato" | "ave" | "roedor" | "reptil" | "otro";

export type EstadoCita =
  | "pendiente"
  | "confirmada"
  | "completada"
  | "cancelada";

export type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export interface FranjaHoraria {
  /** Hora de inicio en formato "HH:mm". */
  desde: string;
  /** Hora de fin en formato "HH:mm". */
  hasta: string;
}

export type Horarios = Partial<Record<DiaSemana, FranjaHoraria[]>>;

export interface Owner {
  id: string;
  nombre: string;
  apellido: string;
  /** Debe ser único en el sistema. */
  email: string;
  telefono: string;
  direccion?: string;
  /** ISO 8601. */
  createdAt: string;
}

export interface Pet {
  id: string;
  /** Referencia a Owner.id. */
  ownerId: string;
  nombre: string;
  especie: Especie;
  raza?: string;
  /** ISO 8601. */
  fechaNacimiento?: string;
  pesoKg?: number;
  notas?: string;
}

export interface Vet {
  id: string;
  nombre: string;
  especialidad: string;
  bio?: string;
  fotoUrl?: string;
  horarios: Horarios;
}

export interface Service {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  duracionMin: number;
  precio: number;
  activo?: boolean;
}

export interface Appointment {
  id: string;
  ownerId: string;
  petId: string;
  vetId: string;
  serviceId: string;
  /** ISO 8601 — inicio del turno. */
  fechaHora: string;
  motivo?: string;
  estado: EstadoCita;
  notas?: string;
  /** ISO 8601. */
  createdAt: string;
}

/** Slot de disponibilidad calculado para un vet en un día. */
export interface Slot {
  inicio: string;
  fin: string;
  disponible: boolean;
}

/**
 * Vista enriquecida de una cita para listados (join de entidades relacionadas).
 * Evita que las vistas tengan que resolver FKs a mano.
 */
export interface AppointmentView
  extends Omit<Appointment, "ownerId" | "petId" | "vetId" | "serviceId"> {
  owner: Pick<Owner, "id" | "nombre" | "apellido">;
  pet: Pick<Pet, "id" | "nombre" | "especie">;
  vet: Pick<Vet, "id" | "nombre" | "especialidad">;
  service: Pick<Service, "id" | "nombre" | "duracionMin">;
}

export type NewAppointmentInput = {
  ownerId: string;
  petId: string;
  vetId: string;
  serviceId: string;
  fechaHora: string;
  motivo?: string;
};
