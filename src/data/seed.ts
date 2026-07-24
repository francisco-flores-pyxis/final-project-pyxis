/**
 * Datos sembrados en memoria para VetLab.
 *
 * Responsabilidades:
 * - Proveer el dataset inicial (≥3 vets, ≥4 servicios, ≥6 dueños, ≥8 mascotas, ≥20 citas).
 * - Generar varias citas "hoy" para el dashboard (R02).
 *
 * Dependencias: `domain/models`.
 * Relación: consumido exclusivamente por `mockApi.ts`.
 *
 * Supuesto: zona horaria America/Montevideo; fechas como ISO UTC derivadas del día local.
 */

import type {
  Appointment,
  Horarios,
  Owner,
  Pet,
  Service,
  Vet,
} from "../domain/models";

/**
 * Construye un ISO a partir de un offset de días respecto a hoy (local) y hora HH:mm.
 *
 * @param dayOffset Días relativos a hoy (0 = hoy, -1 = ayer).
 * @param time Hora local "HH:mm".
 */
function isoAt(dayOffset: number, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

const weekdayHours: Horarios = {
  lun: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "19:00" }],
  mar: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "19:00" }],
  mie: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "19:00" }],
  jue: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "19:00" }],
  vie: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "18:00" }],
  sab: [{ desde: "09:00", hasta: "13:00" }],
};

export const seedOwners: Owner[] = [
  {
    id: "own-1",
    nombre: "Ana",
    apellido: "Pérez",
    email: "ana.perez@email.com",
    telefono: "+598 99 111 111",
    direccion: "18 de Julio 1234, Montevideo",
    createdAt: isoAt(-90, "10:00"),
  },
  {
    id: "own-2",
    nombre: "Bruno",
    apellido: "Silva",
    email: "bruno.silva@email.com",
    telefono: "+598 99 222 222",
    direccion: "Rivera 567, Montevideo",
    createdAt: isoAt(-80, "11:00"),
  },
  {
    id: "own-3",
    nombre: "Carla",
    apellido: "Rodríguez",
    email: "carla.rodriguez@email.com",
    telefono: "+598 99 333 333",
    createdAt: isoAt(-70, "09:30"),
  },
  {
    id: "own-4",
    nombre: "Diego",
    apellido: "Fernández",
    email: "diego.fernandez@email.com",
    telefono: "+598 99 444 444",
    direccion: "Bulevar Artigas 890",
    createdAt: isoAt(-60, "14:00"),
  },
  {
    id: "own-5",
    nombre: "Elena",
    apellido: "Martínez",
    email: "elena.martinez@email.com",
    telefono: "+598 99 555 555",
    createdAt: isoAt(-50, "16:00"),
  },
  {
    id: "own-6",
    nombre: "Facundo",
    apellido: "Gómez",
    email: "facundo.gomez@email.com",
    telefono: "+598 99 666 666",
    direccion: "Av. Italia 2100",
    createdAt: isoAt(-40, "12:00"),
  },
];

export const seedPets: Pet[] = [
  {
    id: "pet-1",
    ownerId: "own-1",
    nombre: "Luna",
    especie: "perro",
    raza: "Labrador",
    pesoKg: 28,
    fechaNacimiento: "2020-03-15T00:00:00.000Z",
  },
  {
    id: "pet-2",
    ownerId: "own-1",
    nombre: "Michi",
    especie: "gato",
    raza: "Común europeo",
    pesoKg: 4.2,
  },
  {
    id: "pet-3",
    ownerId: "own-2",
    nombre: "Rocky",
    especie: "perro",
    raza: "Bulldog",
    pesoKg: 22,
  },
  {
    id: "pet-4",
    ownerId: "own-3",
    nombre: "Nube",
    especie: "gato",
    raza: "Siamés",
    pesoKg: 3.8,
  },
  {
    id: "pet-5",
    ownerId: "own-3",
    nombre: "Pico",
    especie: "ave",
    raza: "Canario",
  },
  {
    id: "pet-6",
    ownerId: "own-4",
    nombre: "Max",
    especie: "perro",
    raza: "Golden Retriever",
    pesoKg: 32,
  },
  {
    id: "pet-7",
    ownerId: "own-5",
    nombre: "Coco",
    especie: "roedor",
    raza: "Hamster",
  },
  {
    id: "pet-8",
    ownerId: "own-6",
    nombre: "Kiwi",
    especie: "reptil",
    raza: "Iguana",
    pesoKg: 1.5,
  },
  {
    id: "pet-9",
    ownerId: "own-2",
    nombre: "Nina",
    especie: "gato",
    pesoKg: 3.5,
  },
];

export const seedVets: Vet[] = [
  {
    id: "vet-1",
    nombre: "Dra. Sofía Álvarez",
    especialidad: "Clínica general",
    bio: "Atención general de perros y gatos.",
    horarios: { ...weekdayHours },
  },
  {
    id: "vet-2",
    nombre: "Dr. Martín Costa",
    especialidad: "Cirugía",
    bio: "Cirugías blandas y traumatología.",
    horarios: {
      lun: [{ desde: "10:00", hasta: "14:00" }],
      mie: [{ desde: "10:00", hasta: "14:00" }, { desde: "16:00", hasta: "19:00" }],
      vie: [{ desde: "09:00", hasta: "13:00" }],
    },
  },
  {
    id: "vet-3",
    nombre: "Dra. Lucía Benítez",
    especialidad: "Dermatología / exóticos",
    bio: "Piel, aves y reptiles.",
    horarios: {
      mar: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "18:00" }],
      jue: [{ desde: "09:00", hasta: "13:00" }, { desde: "15:00", hasta: "18:00" }],
      sab: [{ desde: "09:00", hasta: "12:00" }],
    },
  },
];

export const seedServices: Service[] = [
  {
    id: "svc-1",
    slug: "consulta-general",
    nombre: "Consulta general",
    descripcion: "Revisión clínica estándar.",
    duracionMin: 30,
    precio: 1200,
    activo: true,
  },
  {
    id: "svc-2",
    slug: "vacunacion",
    nombre: "Vacunación",
    descripcion: "Aplicación de vacunas según calendario.",
    duracionMin: 20,
    precio: 900,
    activo: true,
  },
  {
    id: "svc-3",
    slug: "cirugia",
    nombre: "Cirugía",
    descripcion: "Procedimiento quirúrgico programado.",
    duracionMin: 90,
    precio: 8500,
    activo: true,
  },
  {
    id: "svc-4",
    slug: "peluqueria",
    nombre: "Peluquería",
    descripcion: "Baño y corte.",
    duracionMin: 60,
    precio: 1500,
    activo: true,
  },
  {
    id: "svc-5",
    slug: "control",
    nombre: "Control",
    descripcion: "Seguimiento post-consulta.",
    duracionMin: 20,
    precio: 800,
    activo: true,
  },
];

/**
 * ≥20 citas: varias hoy, algunas pasadas y futuras, con distintos estados.
 */
export const seedAppointments: Appointment[] = [
  // Hoy
  {
    id: "apt-1",
    ownerId: "own-1",
    petId: "pet-1",
    vetId: "vet-1",
    serviceId: "svc-1",
    fechaHora: isoAt(0, "09:00"),
    estado: "confirmada",
    motivo: "Control anual",
    createdAt: isoAt(-2, "10:00"),
  },
  {
    id: "apt-2",
    ownerId: "own-2",
    petId: "pet-3",
    vetId: "vet-1",
    serviceId: "svc-2",
    fechaHora: isoAt(0, "09:30"),
    estado: "pendiente",
    createdAt: isoAt(-1, "11:00"),
  },
  {
    id: "apt-3",
    ownerId: "own-3",
    petId: "pet-4",
    vetId: "vet-1",
    serviceId: "svc-1",
    fechaHora: isoAt(0, "10:30"),
    estado: "confirmada",
    createdAt: isoAt(-3, "09:00"),
  },
  {
    id: "apt-4",
    ownerId: "own-4",
    petId: "pet-6",
    vetId: "vet-1",
    serviceId: "svc-4",
    fechaHora: isoAt(0, "11:30"),
    estado: "pendiente",
    createdAt: isoAt(-1, "15:00"),
  },
  {
    id: "apt-5",
    ownerId: "own-5",
    petId: "pet-7",
    vetId: "vet-1",
    serviceId: "svc-5",
    fechaHora: isoAt(0, "15:00"),
    estado: "confirmada",
    createdAt: isoAt(-4, "12:00"),
  },
  {
    id: "apt-6",
    ownerId: "own-6",
    petId: "pet-8",
    vetId: "vet-3",
    serviceId: "svc-1",
    fechaHora: isoAt(0, "16:00"),
    estado: "pendiente",
    createdAt: isoAt(-2, "16:00"),
  },
  {
    id: "apt-7",
    ownerId: "own-1",
    petId: "pet-2",
    vetId: "vet-1",
    serviceId: "svc-5",
    fechaHora: isoAt(0, "17:00"),
    estado: "confirmada",
    createdAt: isoAt(-1, "09:00"),
  },
  // Pasadas / futuras
  {
    id: "apt-8",
    ownerId: "own-2",
    petId: "pet-9",
    vetId: "vet-1",
    serviceId: "svc-1",
    fechaHora: isoAt(-1, "10:00"),
    estado: "completada",
    createdAt: isoAt(-5, "10:00"),
  },
  {
    id: "apt-9",
    ownerId: "own-3",
    petId: "pet-5",
    vetId: "vet-3",
    serviceId: "svc-1",
    fechaHora: isoAt(-2, "11:00"),
    estado: "completada",
    createdAt: isoAt(-6, "11:00"),
  },
  {
    id: "apt-10",
    ownerId: "own-4",
    petId: "pet-6",
    vetId: "vet-2",
    serviceId: "svc-3",
    fechaHora: isoAt(-3, "10:00"),
    estado: "completada",
    createdAt: isoAt(-10, "08:00"),
  },
  {
    id: "apt-11",
    ownerId: "own-5",
    petId: "pet-7",
    vetId: "vet-1",
    serviceId: "svc-2",
    fechaHora: isoAt(-4, "09:30"),
    estado: "cancelada",
    createdAt: isoAt(-7, "14:00"),
  },
  {
    id: "apt-12",
    ownerId: "own-6",
    petId: "pet-8",
    vetId: "vet-3",
    serviceId: "svc-5",
    fechaHora: isoAt(-5, "15:30"),
    estado: "completada",
    createdAt: isoAt(-8, "10:00"),
  },
  {
    id: "apt-13",
    ownerId: "own-1",
    petId: "pet-1",
    vetId: "vet-1",
    serviceId: "svc-4",
    fechaHora: isoAt(-7, "11:00"),
    estado: "completada",
    createdAt: isoAt(-12, "09:00"),
  },
  {
    id: "apt-14",
    ownerId: "own-2",
    petId: "pet-3",
    vetId: "vet-1",
    serviceId: "svc-1",
    fechaHora: isoAt(-8, "16:00"),
    estado: "completada",
    createdAt: isoAt(-14, "11:00"),
  },
  {
    id: "apt-15",
    ownerId: "own-3",
    petId: "pet-4",
    vetId: "vet-1",
    serviceId: "svc-2",
    fechaHora: isoAt(1, "09:00"),
    estado: "pendiente",
    createdAt: isoAt(-1, "18:00"),
  },
  {
    id: "apt-16",
    ownerId: "own-4",
    petId: "pet-6",
    vetId: "vet-1",
    serviceId: "svc-1",
    fechaHora: isoAt(1, "10:00"),
    estado: "confirmada",
    createdAt: isoAt(-2, "12:00"),
  },
  {
    id: "apt-17",
    ownerId: "own-5",
    petId: "pet-7",
    vetId: "vet-2",
    serviceId: "svc-3",
    fechaHora: isoAt(2, "10:00"),
    estado: "pendiente",
    createdAt: isoAt(-3, "09:00"),
  },
  {
    id: "apt-18",
    ownerId: "own-6",
    petId: "pet-8",
    vetId: "vet-3",
    serviceId: "svc-1",
    fechaHora: isoAt(2, "11:00"),
    estado: "confirmada",
    createdAt: isoAt(-1, "10:00"),
  },
  {
    id: "apt-19",
    ownerId: "own-1",
    petId: "pet-2",
    vetId: "vet-1",
    serviceId: "svc-5",
    fechaHora: isoAt(3, "15:00"),
    estado: "pendiente",
    createdAt: isoAt(0, "08:00"),
  },
  {
    id: "apt-20",
    ownerId: "own-2",
    petId: "pet-9",
    vetId: "vet-1",
    serviceId: "svc-1",
    fechaHora: isoAt(3, "16:00"),
    estado: "pendiente",
    createdAt: isoAt(0, "08:30"),
  },
  {
    id: "apt-21",
    ownerId: "own-3",
    petId: "pet-5",
    vetId: "vet-3",
    serviceId: "svc-1",
    fechaHora: isoAt(-10, "09:00"),
    estado: "completada",
    createdAt: isoAt(-15, "10:00"),
  },
];
