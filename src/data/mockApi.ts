/**
 * Mock API en memoria de VetLab.
 *
 * Responsabilidades:
 * - Exponer operaciones CRUD simuladas como Promises con latencia.
 * - Memoizar Promises de lectura por clave (requerido por `use()` + Suspense en R13).
 * - Validar solapamiento de citas al crear.
 * - Permitir fallos aleatorios en mutaciones (R15 — rollback optimista).
 *
 * Dependencias: `domain/models`, `data/seed`.
 * Relación: única puerta de datos para hooks y views; no hay backend real.
 *
 * Cuándo usarlo: toda lectura/escritura de dominio pasa por aquí.
 */

import type {
  Appointment,
  AppointmentView,
  EstadoCita,
  NewAppointmentInput,
  Owner,
  Pet,
  Service,
  Slot,
  Vet,
} from "../domain/models";
import {
  seedAppointments,
  seedOwners,
  seedPets,
  seedServices,
  seedVets,
} from "./seed";

/** Configuración del mock — ajustable sin tocar consumidores. */
export const mockConfig = {
  /** Latencia base de lecturas (ms). */
  latencyMs: 400,
  /** Probabilidad 0–1 de fallar mutaciones (R15). 0 = desactivado. */
  mutationFailRate: 0,
};

/** Estado mutable en memoria (clon del seed). */
const db = {
  owners: [...seedOwners],
  pets: [...seedPets],
  vets: [...seedVets],
  services: [...seedServices],
  appointments: [...seedAppointments],
};

/** Cache de Promises de lectura — clave estable → misma Promise entre renders. */
const promiseCache = new Map<string, Promise<unknown>>();

/**
 * Simula latencia de red.
 *
 * @param ms Milisegundos a esperar (default: mockConfig.latencyMs).
 */
function delay(ms: number = mockConfig.latencyMs): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Obtiene o crea una Promise memoizada por clave.
 * Evita el loop infinito de Suspense si el consumidor llama en cada render.
 */
function cached<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = promiseCache.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = factory();
  promiseCache.set(key, promise);
  return promise;
}

/** Invalida entradas de cache que coincidan con el prefijo. */
function invalidate(prefix: string): void {
  for (const key of promiseCache.keys()) {
    if (key.startsWith(prefix)) {
      promiseCache.delete(key);
    }
  }
}

/** Genera un id simple con prefijo. */
function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * ¿Dos intervalos [start, end) se solapan?
 * Regla de negocio §1.4.
 */
function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Duración de un servicio en minutos; fallback 30. */
function serviceDuration(serviceId: string): number {
  return db.services.find((s) => s.id === serviceId)?.duracionMin ?? 30;
}

/**
 * ¿La cita está "activa" (ocupa slot)? Canceladas no ocupan.
 */
function isActive(estado: EstadoCita): boolean {
  return estado !== "cancelada";
}

/**
 * Enriquece una Appointment con joins mínimos para listados.
 */
function toView(apt: Appointment): AppointmentView {
  const owner = db.owners.find((o) => o.id === apt.ownerId);
  const pet = db.pets.find((p) => p.id === apt.petId);
  const vet = db.vets.find((v) => v.id === apt.vetId);
  const service = db.services.find((s) => s.id === apt.serviceId);

  if (!owner || !pet || !vet || !service) {
    throw new Error(`Cita ${apt.id}: referencias rotas en el seed.`);
  }

  return {
    id: apt.id,
    fechaHora: apt.fechaHora,
    motivo: apt.motivo,
    estado: apt.estado,
    notas: apt.notas,
    createdAt: apt.createdAt,
    owner: {
      id: owner.id,
      nombre: owner.nombre,
      apellido: owner.apellido,
    },
    pet: {
      id: pet.id,
      nombre: pet.nombre,
      especie: pet.especie,
    },
    vet: {
      id: vet.id,
      nombre: vet.nombre,
      especialidad: vet.especialidad,
    },
    service: {
      id: service.id,
      nombre: service.nombre,
      duracionMin: service.duracionMin,
    },
  };
}

/**
 * Compara si una fecha ISO cae en el mismo día civil local que `dateISO`.
 */
function sameLocalDay(iso: string, dateISO: string): boolean {
  const a = new Date(iso);
  const b = new Date(dateISO);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Posible fallo aleatorio de mutación (para R15). */
async function maybeFailMutation(): Promise<void> {
  if (mockConfig.mutationFailRate <= 0) return;
  if (Math.random() < mockConfig.mutationFailRate) {
    await delay(200);
    throw new Error("Error simulado del servidor (mock).");
  }
}

export interface VetApi {
  getCitasDelDia(dateISO: string): Promise<AppointmentView[]>;
  getDuenos(q?: string): Promise<Owner[]>;
  getDueno(id: string): Promise<Owner>;
  getMascotasDeDueno(ownerId: string): Promise<Pet[]>;
  getHistorialCitas(ownerId: string): Promise<AppointmentView[]>;
  getVets(): Promise<Vet[]>;
  getServicios(): Promise<Service[]>;
  getDisponibilidad(vetId: string, dateISO: string): Promise<Slot[]>;
  crearCita(input: NewAppointmentInput): Promise<Appointment>;
  cambiarEstadoCita(id: string, estado: EstadoCita): Promise<Appointment>;
  /** Alta simple de dueño (R01). El wizard R04 usa `crearDuenoConMascota`. */
  crearDueno(owner: Omit<Owner, "id" | "createdAt">): Promise<Owner>;
  crearDuenoConMascota(
    owner: Omit<Owner, "id" | "createdAt">,
    pet: Omit<Pet, "id" | "ownerId">,
  ): Promise<{ owner: Owner; pet: Pet }>;
}

/**
 * Implementación concreta del mock.
 * Exportada como singleton `vetApi` para toda la app.
 */
export const vetApi: VetApi = {
  getCitasDelDia(dateISO: string): Promise<AppointmentView[]> {
    const dayKey = dateISO.slice(0, 10);
    return cached(`citas:${dayKey}`, async () => {
      await delay();
      return db.appointments
        .filter((a) => sameLocalDay(a.fechaHora, dateISO))
        .sort(
          (a, b) =>
            new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
        )
        .map(toView);
    });
  },

  getDuenos(q?: string): Promise<Owner[]> {
    const key = `duenos:${q?.trim().toLowerCase() ?? ""}`;
    return cached(key, async () => {
      await delay();
      const query = q?.trim().toLowerCase();
      if (!query) return [...db.owners];
      return db.owners.filter((o) => {
        const haystack =
          `${o.nombre} ${o.apellido} ${o.email} ${o.telefono}`.toLowerCase();
        return haystack.includes(query);
      });
    });
  },

  getDueno(id: string): Promise<Owner> {
    return cached(`dueno:${id}`, async () => {
      await delay();
      const owner = db.owners.find((o) => o.id === id);
      if (!owner) throw new Error(`Dueño ${id} no encontrado.`);
      return owner;
    });
  },

  getMascotasDeDueno(ownerId: string): Promise<Pet[]> {
    return cached(`mascotas:${ownerId}`, async () => {
      await delay(300);
      return db.pets.filter((p) => p.ownerId === ownerId);
    });
  },

  getHistorialCitas(ownerId: string): Promise<AppointmentView[]> {
    return cached(`historial:${ownerId}`, async () => {
      // Latencia mayor a propósito: R13 muestra boundaries independientes.
      await delay(900);
      return db.appointments
        .filter((a) => a.ownerId === ownerId)
        .sort(
          (a, b) =>
            new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
        )
        .map(toView);
    });
  },

  getVets(): Promise<Vet[]> {
    return cached("vets", async () => {
      await delay();
      return [...db.vets];
    });
  },

  getServicios(): Promise<Service[]> {
    return cached("servicios", async () => {
      await delay();
      return db.services.filter((s) => s.activo !== false);
    });
  },

  getDisponibilidad(vetId: string, dateISO: string): Promise<Slot[]> {
    const dayKey = dateISO.slice(0, 10);
    return cached(`disp:${vetId}:${dayKey}`, async () => {
      await delay();
      const vet = db.vets.find((v) => v.id === vetId);
      if (!vet) throw new Error(`Vet ${vetId} no encontrado.`);

      const day = new Date(dateISO);
      const dias: Array<keyof typeof vet.horarios> = [
        "dom",
        "lun",
        "mar",
        "mie",
        "jue",
        "vie",
        "sab",
      ];
      const diaKey = dias[day.getDay()];
      const franjas = (diaKey && vet.horarios[diaKey]) ?? [];

      const slots: Slot[] = [];
      const slotMinutes = 30;

      for (const franja of franjas) {
        const [hDesde, mDesde] = franja.desde.split(":").map(Number);
        const [hHasta, mHasta] = franja.hasta.split(":").map(Number);
        const cursor = new Date(day);
        cursor.setHours(hDesde ?? 0, mDesde ?? 0, 0, 0);
        const end = new Date(day);
        end.setHours(hHasta ?? 0, mHasta ?? 0, 0, 0);

        while (cursor.getTime() + slotMinutes * 60_000 <= end.getTime()) {
          const inicio = new Date(cursor);
          const fin = new Date(cursor.getTime() + slotMinutes * 60_000);

          const ocupado = db.appointments.some((apt) => {
            if (apt.vetId !== vetId || !isActive(apt.estado)) return false;
            if (!sameLocalDay(apt.fechaHora, dateISO)) return false;
            const aptStart = new Date(apt.fechaHora).getTime();
            const aptEnd =
              aptStart + serviceDuration(apt.serviceId) * 60_000;
            return intervalsOverlap(
              inicio.getTime(),
              fin.getTime(),
              aptStart,
              aptEnd,
            );
          });

          slots.push({
            inicio: inicio.toISOString(),
            fin: fin.toISOString(),
            disponible: !ocupado,
          });
          cursor.setMinutes(cursor.getMinutes() + slotMinutes);
        }
      }

      return slots;
    });
  },

  async crearCita(input: NewAppointmentInput): Promise<Appointment> {
    await maybeFailMutation();
    await delay(500);

    const duration = serviceDuration(input.serviceId);
    const start = new Date(input.fechaHora).getTime();
    const end = start + duration * 60_000;

    const overlap = db.appointments.some((apt) => {
      if (apt.vetId !== input.vetId || !isActive(apt.estado)) return false;
      const aptStart = new Date(apt.fechaHora).getTime();
      const aptEnd = aptStart + serviceDuration(apt.serviceId) * 60_000;
      return intervalsOverlap(start, end, aptStart, aptEnd);
    });

    if (overlap) {
      throw new Error(
        "El horario se solapa con otra cita activa del mismo veterinario.",
      );
    }

    const appointment: Appointment = {
      id: nextId("apt"),
      ownerId: input.ownerId,
      petId: input.petId,
      vetId: input.vetId,
      serviceId: input.serviceId,
      fechaHora: input.fechaHora,
      motivo: input.motivo,
      estado: "pendiente",
      createdAt: new Date().toISOString(),
    };

    db.appointments.push(appointment);
    invalidate("citas:");
    invalidate("disp:");
    invalidate(`historial:${input.ownerId}`);
    return appointment;
  },

  async cambiarEstadoCita(
    id: string,
    estado: EstadoCita,
  ): Promise<Appointment> {
    await maybeFailMutation();
    await delay(400);

    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) throw new Error(`Cita ${id} no encontrada.`);

    apt.estado = estado;
    invalidate("citas:");
    invalidate("disp:");
    invalidate(`historial:${apt.ownerId}`);
    return { ...apt };
  },

  async crearDueno(
    ownerInput: Omit<Owner, "id" | "createdAt">,
  ): Promise<Owner> {
    await maybeFailMutation();
    await delay(500);

    const emailTaken = db.owners.some(
      (o) => o.email.toLowerCase() === ownerInput.email.toLowerCase(),
    );
    if (emailTaken) {
      throw new Error("Ya existe un dueño con ese email.");
    }

    const owner: Owner = {
      ...ownerInput,
      id: nextId("own"),
      createdAt: new Date().toISOString(),
    };

    db.owners.push(owner);
    invalidate("duenos:");
    return owner;
  },

  async crearDuenoConMascota(
    ownerInput: Omit<Owner, "id" | "createdAt">,
    petInput: Omit<Pet, "id" | "ownerId">,
  ): Promise<{ owner: Owner; pet: Pet }> {
    await maybeFailMutation();
    await delay(500);

    const emailTaken = db.owners.some(
      (o) => o.email.toLowerCase() === ownerInput.email.toLowerCase(),
    );
    if (emailTaken) {
      throw new Error("Ya existe un dueño con ese email.");
    }

    const owner: Owner = {
      ...ownerInput,
      id: nextId("own"),
      createdAt: new Date().toISOString(),
    };
    const pet: Pet = {
      ...petInput,
      id: nextId("pet"),
      ownerId: owner.id,
    };

    db.owners.push(owner);
    db.pets.push(pet);
    invalidate("duenos:");
    return { owner, pet };
  },
};
