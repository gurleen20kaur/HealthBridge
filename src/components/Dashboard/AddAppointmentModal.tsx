/**
 * AddAppointmentModal — simple modal form to add an appointment
 *
 * Renders as a fixed overlay when `isOpen`. Calls onAdd with the new
 * appointment, parent merges it into userData.appointments.
 */

"use client";

import { useState } from "react";
import { Appointment } from "@/types";

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (appointment: Appointment) => void;
}

export function AddAppointmentModal({
  isOpen,
  onClose,
  onAdd,
}: AddAppointmentModalProps) {
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !date || !specialty) return;

    const isoDateTime = new Date(`${date}T${time}`).toISOString();
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      date: isoDateTime,
      doctorName,
      specialty,
      reason: reason || "Visit",
      location: location || "Not specified",
      status: "upcoming",
    };

    onAdd(newApt);
    // Reset form
    setDoctorName("");
    setSpecialty("");
    setDate("");
    setTime("10:00");
    setReason("");
    setLocation("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-slate-800 mb-4">Add appointment</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor name
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
              placeholder="Dr. Jane Smith"
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Specialty
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              required
              placeholder="Primary Care, Dermatologist..."
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Annual physical, follow-up..."
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Clinic name"
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
