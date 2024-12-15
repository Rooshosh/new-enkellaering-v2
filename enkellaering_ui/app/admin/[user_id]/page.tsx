"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation";
import { LampContainer } from "@/components/ui/lamp";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
  } from "@/components/ui/chart";
  
  import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { format } from "path";
  

const BASEURL = process.env.NEXT_PUBLIC_BASE_URL;


type Student = {
    user_id: string,
    firstname_parent: string,
    lastname_parent: string,
    email_parent: string,
    phone_parent: string,

    firstname_student: string,
    lastname_student: string,
    phone_student: string,

    main_subjects: string,
    address: string,
    postal_code: string,
    has_physical_tutoring: boolean,
    created_at: string,
    additional_comments: string,
    your_teacher: string
}

type Teacher = {
    user_id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
    postal_code: string;
    hourly_pay: string;
    resgined: boolean;
    additional_comments: string | null;
    created_at: string;
    admin: boolean;
    resigned_at: string | null;
}

type Classes = {
    comment: string; // Optional comment for the session
    created_at: string; // Timestamp when the record was created (ISO format)
    started_at: string; // Timestamp for when the session started (ISO format)
    ended_at: string; // Timestamp for when the session ended (ISO format)
    invoiced_student: boolean; // Indicates if the student was invoiced
    paid_teacher: boolean; // Indicates if the teacher was paid
};


export default function AdminPage() {
    const router = useRouter()
    const [teacher, setTeacher] = useState<Teacher>()
    const pathname = usePathname(); // Get the current pathname
    const segments = pathname.split('/'); // Split the pathname into segments
    const userId :string= segments[2].toString(); // Extract the 'user_id' from the correct position

    function handleSetTeacher(teacher: Teacher) {
        setTeacher(teacher)
    }

    protectAdmin({user_id: userId, handleSetTeacher})

    //this user is an admin
    if (!teacher) {
        return <p>Loading...</p>
    }

    if(!teacher.admin) {
        console.log("Du er ikk en admin")
        router.push("/login-teacher")
    }

    return(<div>
        <TeacherName teacher={teacher}/>
        <DailyRevenueChart admin_user_id={userId}/>

    </div>)
}

function protectAdmin( {user_id, handleSetTeacher} :{user_id: string, handleSetTeacher: (teacher: Teacher) => void}) {
    const [isAdmin, setIsAdmin] = useState<boolean>(false)
    
    useEffect( () => {

        async function fetchTeacher(user_id :string) {
            const response = await fetch(`${BASEURL}/get-teacher`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "user_id": user_id
                })
            })
    
            if (!response.ok) {
                alert("failed to fetch teacher: " + response.statusText)
                setIsAdmin(false)
            }

            const data = await response.json()
            const teacher = data.teacher
            handleSetTeacher(teacher)

            if (teacher.admin) {
                setIsAdmin(true)
            }
            else {
                setIsAdmin(false)
            }
        }
        fetchTeacher(user_id)

    },[BASEURL, user_id])

    return isAdmin
}


function TeacherName({teacher} : {teacher: Teacher}) {
    const teacherFirstname = teacher.firstname;
    const teacherLastname = teacher.lastname;



    return (<>
        <LampContainer>
            <motion.h1
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
                }}
                className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
            >
                <span className="text-light-">Velkommen til admin</span>
                <br/>
                {teacherFirstname} {teacherLastname}
            </motion.h1>
        </LampContainer>
    </>)
}



function calculatePayment(classSession: Classes, hourlyCharge: number): number {
    const start = new Date(classSession.started_at);
    const end = new Date(classSession.ended_at);
  
    // Calculate the difference in milliseconds
    const differenceInMilliseconds = end.getTime() - start.getTime();
  
    // Convert milliseconds to hours
    const durationInHours = differenceInMilliseconds / (1000 * 60 * 60);
  
    // Calculate the payment
    const payment = durationInHours * hourlyCharge;
  
    return Math.round(payment); // Optional: Round to the nearest integer
}

type FormattedClass = {
    started_at: string;
    payment: number;
}
function getDaysInMonth(year :number, month :number) {
    // Create a date object for the first day of the next month
    let date = new Date(year, month, 0);
    // Get the day, which represents the number of days in the month
    return date.getDate();
}

function DailyRevenueChart({ admin_user_id }: { admin_user_id :string }) {
    const [chartData, setChartData] = useState<Classes[]>()
    const [formattedChartData, setFormattedChartdata] = useState<FormattedClass[]>([])
    const [totalPayment, setTotalPayment] = useState<number>(0); // Use state for totalPayment


    const chartConfig = {
        desktop: {
        label: "Desktop",
        color: "#2563eb",
        },
        mobile: {
        label: "Mobile",
        color: "#60a5fa",
        },
    } satisfies ChartConfig

    useEffect( () => {
        async function fetchRevenue() {
            try {
                const response = await fetch(`${BASEURL}/get-all-classes`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "admin_user_id": admin_user_id
                    })
                })

                if (!response.ok) {
                    alert("An error happened while fetching revenue")
                }

                const data = await response.json()
                const classes = data.classes

                setChartData(classes)

            }
            catch {
                alert("An error happened while fetching revenue")
            }
        }
        fetchRevenue()
    },[BASEURL, admin_user_id])

    //aggregate payments
    useEffect(() => {
        //go thrugh each day of the month
        const currentDate = new Date(); // Get the current date and time
        const currentMonth = currentDate.getMonth(); // Get the current month (0-11)
        const numberOfDays = getDaysInMonth(currentDate.getFullYear(), currentMonth + 1); // Get the number of days in the current month
        let totalPayment :number =0;

        //go through classses and populate chartdata by each day
        for (let day = 1; day <= numberOfDays; day++) {
            const thisDate :Date= new Date(currentDate.getFullYear(), currentMonth, day);
            const thisDateString: string = thisDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD

            let totalPaymentToday :number = 0
            chartData?.forEach( c => {
                const startedAtDate = new Date(c.started_at);
                const startedAtString = startedAtDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD

                if (startedAtString === thisDateString) {
                    totalPaymentToday += calculatePayment(c, 540);
                }
            })

            const formattedClass = {
                started_at: thisDateString,
                payment: totalPaymentToday
            }

            setFormattedChartdata(prevData => [...prevData, formattedClass])
            totalPayment += totalPaymentToday
        }

        setTotalPayment(totalPayment)

      }, [chartData, admin_user_id]);
    
    
    if (formattedChartData?.length === 0) {
        return <p>Loading...</p>;
    }


    return(<div className="w-3/4 h-full p-4">
        <Card>
        <CardHeader>
            <CardTitle>Ufakturerte timer for alle lærere</CardTitle>
            <CardDescription>
                {new Date().toLocaleString("en-US", { month: "long" }).toUpperCase()}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={formattedChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="dag"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                />
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="payment" fill="#FF5733" radius={4} />
            </BarChart>
            </ChartContainer>
        </CardContent>
        <CardFooter>
            <h4>Totalt ufakturert denne måneded: <span className="font-bold">{totalPayment}</span>kr.</h4>

        </CardFooter>

        </Card>
    </div>)
}
