"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";

export default function SignupForm() {
  const [validPhone, setValidPhone] = useState(true);
  const [validPostalCode, setValidPostalCode] = useState(true);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isSendDisabled, setIsSendDisabled] = useState<boolean>(false);

  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  function validateField(value: string, expectedLength: number, setValid: (valid: boolean) => void) {
    const isValid = value.length === expectedLength;
    setValid(isValid);
    return isValid;
  }

  function validateForm(e: React.FormEvent<HTMLFormElement>) {
    const form = e.target as HTMLFormElement;
    let allValid = true;

    // Validate phone and postal code lengths
    allValid = validateField(form["phone"].value, 8, setValidPhone) && allValid;
    allValid = validateField(form["postal-code"].value, 4, setValidPostalCode) && allValid;

    // Validate password match
    const password = form["password"].value;
    const repeatPassword = form["repeat-password"].value;
    if (password !== repeatPassword) {
      setPasswordsMatch(false);
      allValid = false;
    } else {
      setPasswordsMatch(true);
    }

    return allValid;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm(e)) {
        console.log("form not valid")
        return;
    }

    setIsSendDisabled(true)
    
    try {
      const form = e.target as HTMLFormElement;

      const email = form["email"].value;
      const password = form["password"].value
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("created user in firebase!")

      const idToken = await userCredential.user.getIdToken();
      console.log("Firebase ID Token:", idToken);


      const response = await fetch(`${BASE_URL}/signup-teacher`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_token: idToken,
          firstname: form["firstname"].value,
          lastname: form["lastname"].value,
          email: form["email"].value,
          phone: form["phone"].value,
          address: form["address"].value,
          postal_code: form["postal-code"].value,
          hourly_pay: "250",
          additional_comments: form["additional-comments"].value,
          resigned: false,
          password: form["password"].value,
          admin: false,
        }),
      });

      console.log(response)

      if (response.ok) {
        response.json().then(data => {
            const userId = data.user_id; // Extract user_id from the response
            const token = data.token

            localStorage.setItem('token', token)
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user_id', userId);
            localStorage.setItem('role', 'teacher');
            localStorage.setItem('isAuthenticated', 'true');
            
            router.push(`/min-side-laerer`);
        }).catch(err => {
            console.error("Failed to parse response JSON:", err);
        });
        
      } else {
        const errorData = await response.json();
        alert(`Signup failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">Velkommen som mentor ved Enkel Læring</h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Fyll ut feltene under for å opprette en konto
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        {/* Teacher Information */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <LabelInputContainer>
            <Label htmlFor="firstname">Fornavn</Label>
            <Input id="firstname" placeholder="Anne" type="text" />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Etternavn</Label>
            <Input id="lastname" placeholder="Jensen" type="text" />
          </LabelInputContainer>
        </div>
        <LabelInputContainer>
          <Label htmlFor="email">E-post</Label>
          <Input id="email" placeholder="anne@enkellæring.no" type="email" />
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="phone">Telefonnummer</Label>
          <Input id="phone" placeholder="12345678" type="tel" className={cn(validPhone ? "" : "border-red-500")} />
          {!validPhone && <p className="text-red-500 text-sm">Telefonnummer må være 8 siffer</p>}
        </LabelInputContainer>

        <br />

        {/* Address Information */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <LabelInputContainer>
            <Label htmlFor="address">Hjemmeadresse</Label>
            <Input id="address" placeholder="123 Main St" type="text" />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="postal-code">Postkode</Label>
            <Input id="postal-code" placeholder="0123" type="text" className={cn(validPostalCode ? "" : "border-red-500")} />
            {!validPostalCode && <p className="text-red-500 text-sm">Postkode må være 4 siffer</p>}
          </LabelInputContainer>
        </div>

        <br />

        {/* Additional Comments */}
        <LabelInputContainer>
          <Label htmlFor="additional-comments">Andre kommentarer</Label>
          <Textarea id="additional-comments" placeholder="Skriv eventuelle kommentarer her" />
        </LabelInputContainer>

        <br />

        {/* Password */}
        <LabelInputContainer>
          <Label htmlFor="password">Passord</Label>
          <Input id="password" placeholder="••••••••" type="password" />
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="repeat-password">Gjenta passordet</Label>
          <Input id="repeat-password" placeholder="••••••••" type="password" className={cn(passwordsMatch ? "" : "border-red-500")} />
          {!passwordsMatch && <p className="text-red-500 text-sm">Passordene må være like</p>}
        </LabelInputContainer>

        <button  type="submit" disabled={isSendDisabled} className="relative inline-flex h-12 overflow-hidden rounded-full p-[5px] dark:p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className={`${isSendDisabled ? "bg-slate-400" :"inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl"}`}>
                Opprett bruker
            </span>
        </button>
      </form>
    </div>
  );
}

const LabelInputContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>;
};