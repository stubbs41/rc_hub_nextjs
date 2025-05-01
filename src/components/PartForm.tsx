"use client";

import { useState, useEffect } from "react";
import { Part } from "@/types/part";
import { addPart, updatePart } from "@/services/partService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PartFormProps {
  part?: Part | null;
  onClose: () => void;
  userId: string;
}

export default function PartForm({ part, onClose, userId }: PartFormProps) {
  const [formData, setFormData] = useState<Partial<Part>>({
    part_number: "",
    name: "",
    description: "",
    category: "",
    quantity: 1,
    status: "",
    purchase_date: null,
    cost: null,
    notes: "",
    user_id: userId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (part) {
      setFormData({
        ...part,
        purchase_date: part.purchase_date ? new Date(part.purchase_date).toISOString().split("T")[0] : null,
        cost: part.cost ?? null,
      });
    } else {
      setFormData({
        part_number: "",
        name: "",
        description: "",
        category: "",
        quantity: 1,
        status: "",
        purchase_date: null,
        cost: null,
        notes: "",
        user_id: userId,
      });
    }
  }, [part, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? parseInt(value, 10) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleFloatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value === "" ? null : parseFloat(value) || null }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ? value : null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name) {
        setError("Part Name is required.");
        setLoading(false);
        return;
    }
    if (formData.quantity === undefined || formData.quantity < 0) {
        setError("Quantity must be a non-negative number.");
        setLoading(false);
        return;
    }

    try {
      const dataToSave: Partial<Part> = {
        ...formData,
        purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null,
        cost: formData.cost ?? null,
        quantity: formData.quantity ?? 1, // Ensure quantity has a default
      };

      if (part?.id) {
        // Update existing part
        await updatePart(part.id, dataToSave);
      } else {
        // Add new part
        if (!dataToSave.user_id) {
            throw new Error("User ID is missing");
        }
        await addPart(dataToSave as Omit<Part, "id" | "created_at" | "updated_at">);
      }
      onClose(); // Close the form/modal on success
    } catch (err) {
      console.error("Failed to save part:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
      <h2 className="text-xl font-semibold mb-4">{part ? "Edit Part" : "Add New Part"}</h2>
      {error && <p className="text-red-500">Error: {error}</p>}
      <div>
        <Label htmlFor="name">Part Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="part_number">Part Number</Label>
        <Input
          id="part_number"
          name="part_number"
          value={formData.part_number || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          value={formData.category || ""}
          onChange={handleChange}
          placeholder="e.g., Motor, ESC, Servo"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          value={formData.quantity ?? 1}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Input
          id="status"
          name="status"
          value={formData.status || ""}
          onChange={handleChange}
          placeholder="e.g., New, Used, Needs Replacement"
          className="mt-1"
        />
      </div>
       <div>
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          name="cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.cost ?? ""}
          onChange={handleFloatChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="purchase_date">Purchase Date</Label>
        <Input
          id="purchase_date"
          name="purchase_date"
          type="date"
          value={formData.purchase_date || ""}
          onChange={handleDateChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Part"}
        </Button>
      </div>
    </form>
  );
}

