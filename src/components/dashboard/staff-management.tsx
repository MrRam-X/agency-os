"use client";

import { useState } from "react";
import { Users, Mail, BadgeDollarSign, Edit3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddEmployeeForm } from "@/components/dashboard/add-employee-form";

export interface SerializedEmployee {
  _id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "HR" | "TEAM_LEAD" | "DEVELOPER" | "TESTER";
  billableRate: number;
  skills: string[];
}

interface StaffManagementProps {
  initialEmployees: SerializedEmployee[];
}

export function StaffManagement({ initialEmployees }: StaffManagementProps) {
  // 🟢 Manage the currently editing target locally
  const [editingEmployee, setEditingEmployee] = useState<SerializedEmployee | null>(null);

  const handleCancelEdit = () => {
    setEditingEmployee(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3 items-start">
      {/* LEFT COLUMN: STAFF DIRECTORY */}
      <div className="lg:col-span-2">
        <Card className="border-zinc-200/80 bg-white shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Staff Directory</CardTitle>
            {/* strictly using escaped apostrophes [20] */}
            <CardDescription>Manage employees, adjust billable rates, and view organization credentials [20].</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {initialEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg m-6 mt-0">
                <Users className="h-8 w-8 text-zinc-300 mb-3" />
                <p className="text-sm font-semibold">No employees provisioned yet</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Use the control panel on the right to register credentials and assign roles.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right w-[140px]">Billable Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialEmployees.map((emp) => (
                    <TableRow key={String(emp._id)}>
                      <TableCell className="font-semibold text-zinc-900">
                        {emp.name}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-zinc-400" /> {emp.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 uppercase bg-zinc-50 text-zinc-600 border-zinc-200">
                          {emp.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Rate display */}
                          <span className="inline-flex items-center text-xs font-bold text-zinc-700">
                            <BadgeDollarSign className="h-3.5 w-3.5 text-zinc-400 mr-0.5" /> {emp.billableRate}/hr
                          </span>

                          {/* 🟢 EDIT EMPLOYEE TRIGGER ICON */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEmployee(emp)}
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100"
                            title="Edit employee settings"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: DYNAMIC ADD/EDIT FORM
          🟢 KEY RESET TECHNIQUE: Passing string(editingEmployee._id) as the React 'key' 
          forces React to completely unmount and re-initialize the component on edit selection.
          This completely bypasses the need for client-side useEffect synchronization hooks! [2, 12, 26] */}
      <div>
        <Card className="border-zinc-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Workspace Provisioning</CardTitle>
            <CardDescription>Edit settings or launch credential sets.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddEmployeeForm 
              key={editingEmployee ? String(editingEmployee._id) : "new"} 
              editingEmployee={editingEmployee}
              onCancel={handleCancelEdit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}