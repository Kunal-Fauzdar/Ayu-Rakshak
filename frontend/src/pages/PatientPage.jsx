import './PatientPage.css';
import { useEffect , useState} from "react";
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
export default function PatientPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDoctors();
  }, []);
   const fetchDoctors = async () => {
    try {
      const response = await fetch('http://localhost:5051/api/doctors/all');
      const data = await response.json();

      if (data.success) {
        setDoctors(data.doctors);
      } else {
        setError('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };
  // const doctors = [
  //   {
  //     id: 1,
  //     name: "Dr. Priya Sharma",
  //     specialty: "Cardiologist",
  //     experience: "12 years",
  //     hospital: "Apollo Hospital, Delhi",
  //     image: "https://randomuser.me/api/portraits/women/44.jpg",
  //     rating: 4.8,
  //     consultationFee: 800,
  //     nextAvailable: "Today, 3:00 PM",
  //     education: "MBBS, MD Cardiology"
  //   },
  //   {
  //     id: 2,
  //     name: "Dr. Rajesh Kumar",
  //     specialty: "Neurologist",
  //     experience: "15 years",
  //     hospital: "AIIMS, New Delhi",
  //     image: "https://randomuser.me/api/portraits/men/45.jpg",
  //     rating: 4.9,
  //     consultationFee: 1200,
  //     nextAvailable: "Tomorrow, 10:00 AM",
  //     education: "MBBS, DM Neurology"
  //   },
  //   {
  //     id: 3,
  //     name: "Dr. Anita Patel",
  //     specialty: "Dermatologist",
  //     experience: "8 years",
  //     hospital: "Fortis Hospital, Mumbai",
  //     image: "https://randomuser.me/api/portraits/women/46.jpg",
  //     rating: 4.7,
  //     consultationFee: 600,
  //     nextAvailable: "Today, 5:30 PM",
  //     education: "MBBS, MD Dermatology"
  //   },
  //   {
  //     id: 4,
  //     name: "Dr. Arjun Singh",
  //     specialty: "Orthopedic Surgeon",
  //     experience: "10 years",
  //     hospital: "Max Hospital, Gurugram",
  //     image: "https://randomuser.me/api/portraits/men/47.jpg",
  //     rating: 4.6,
  //     consultationFee: 900,
  //     nextAvailable: "Tomorrow, 2:00 PM",
  //     education: "MBBS, MS Orthopedics"
  //   },
  //   {
  //     id: 5,
  //     name: "Dr. Meera Reddy",
  //     specialty: "Pediatrician",
  //     experience: "14 years",
  //     hospital: "Rainbow Children's Hospital",
  //     image: "https://randomuser.me/api/portraits/women/48.jpg",
  //     rating: 4.9,
  //     consultationFee: 700,
  //     nextAvailable: "Today, 4:15 PM",
  //     education: "MBBS, MD Pediatrics"
  //   },
  //   {
  //     id: 6,
  //     name: "Dr. Vikram Gupta",
  //     specialty: "Gastroenterologist",
  //     experience: "11 years",
  //     hospital: "Medanta Hospital, Gurugram",
  //     image: "https://randomuser.me/api/portraits/men/49.jpg",
  //     rating: 4.8,
  //     consultationFee: 1000,
  //     nextAvailable: "Tomorrow, 11:30 AM",
  //     education: "MBBS, DM Gastroenterology"
  //   }
  // ];

  const handleBookAppointment = async (doctor) => {
    // if (!user) {
    //     alert('Please login to book appointment');
    //     return;
    // }

    // setBookingStates(prev => ({ ...prev, [doctor.id]: 'loading' }));

    try {
        const response = await fetch('http://localhost:5051/api/appointments/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                doctorId: doctor._id,
                doctorName: doctor.name,
                specialty: doctor.specialty,
                senderId: user.id,
                senderName: user.name
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // setBookingStates(prev => ({ ...prev, [doctor.id]: 'success' }));
            alert('Request sent to doctor successfully!');
            
            setTimeout(() => {
                // setBookingStates(prev => ({ ...prev, [doctor.id]: null }));
            }, 3000);
        } else {
            // setBookingStates(prev => ({ ...prev, [doctor.id]: 'error' }));
            alert(data.message || 'Failed to send request');
        }
    } catch (error) {
        console.error('Booking error:', error);
        // setBookingStates(prev => ({ ...prev, [doctor.id]: 'error' }));
        alert('Booking error:', error);
    }
};


  return (
    <>
      <Navbar />
    
      <div className="doctor-app bg-light min-vh-100">
        {/* Header */}
        <div className="bg-success text-white py-4 mb-4">
          <div className="container">
            <h1 className="text-center mb-0">Find Your Doctor</h1>
            <p className="text-center mb-0">Book appointments with expert doctors</p>
          </div>
        </div>

        <div className="container">
          {/* Doctors Grid */}
          <div className="row">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                <div className="doctor-card card h-100 shadow-sm border-0">
                  <div className="card-body p-4 text-center">
                    {/* Doctor Image */}
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="doctor-image rounded-circle mb-3"
                    />

                    {/* Doctor Info */}
                    <h5 className="card-title mb-2">{doctor.name}</h5>
                    <span className="badge bg-success mb-2">{doctor.specialty}</span>
                    
                    {/* Details */}
                    <p className="text-muted small mb-1">{doctor.education}</p>
                    <p className="text-muted small mb-2">{doctor.hospital}</p>
                    <p className="text-muted small mb-2">{doctor.experience} experience</p>

                    
                  </div>

                  {/* Book Now Button */}
                  <div className="card-footer bg-white border-0 pt-0">
                    <div className="d-grid">
                      <button className="btn btn-success" onClick={() => handleBookAppointment(doctor)}>
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};






