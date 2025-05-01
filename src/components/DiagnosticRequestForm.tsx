"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Vehicle } from "@/types/vehicle";
import { fetchVehicles } from "@/services/vehicleService";
import { createDiagnosticRequest, uploadDiagnosticImage } from "@/services/diagnosticService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DiagnosticRequestFormProps {
  userId: string;
  onClose: () => void; // Function to close the form/modal
}

export default function DiagnosticRequestForm({ userId, onClose }: DiagnosticRequestFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Fetch user's vehicles to populate the dropdown
    const loadVehicles = async () => {
      try {
        const data = await fetchVehicles(userId);
        setVehicles(data);
      } catch (err) {
        console.error("Failed to load vehicles:", err);
        // Handle error appropriately
      }
    };
    loadVehicles();
  }, [userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploading(false);

    if (!issueDescription.trim()) {
      setError("Please describe the issue.");
      setLoading(false);
      return;
    }

    let imageUrls: string[] = [];
    if (selectedFiles && selectedFiles.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = Array.from(selectedFiles).map(file =>
          uploadDiagnosticImage(userId, file)
        );
        imageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        setError(uploadError instanceof Error ? uploadError.message : "Failed to upload images.");
        setLoading(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      await createDiagnosticRequest({
        user_id: userId,
        vehicle_id: selectedVehicleId,
        issue_description: issueDescription,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      });
      onClose(); // Close the form/modal on success
    } catch (err) {
      console.error("Failed to create diagnostic request:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
      <h2 className="text-xl font-semibold mb-4">New Diagnostic Request</h2>
      {error && <p className="text-red-500">Error: {error}</p>}

      <div>
        <Label htmlFor="vehicle">Select Vehicle (Optional)</Label>
        <Select onValueChange={(value) => setSelectedVehicleId(value === "none" ? null : value)} value={selectedVehicleId ?? "none"}>
          <SelectTrigger id="vehicle" className="mt-1">
            <SelectValue placeholder="Select a vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.name} ({vehicle.brand} {vehicle.model})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="issue_description">Describe the Issue *</Label>
        <Textarea
          id="issue_description"
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          required
          placeholder="Describe the problem you are experiencing..."
          className="mt-1"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="images">Upload Images (Optional)</Label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        {uploading && <p className="text-sm text-blue-600 mt-1">Uploading images...</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading || uploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? (uploading ? "Uploading..." : "Submitting...") : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}

