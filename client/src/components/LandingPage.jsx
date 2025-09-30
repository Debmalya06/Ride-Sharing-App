import { Link } from 'react-router-dom'
import { ArrowRight, Shield, CreditCard, MapPin, Clock, Users, Briefcase } from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Share Your Journey,{' '}
                <span className="text-yellow-500">Save Money</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Connect with fellow travelers heading in the same direction. Split costs, reduce emissions, and make new connections on every trip.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register?type=passenger"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-lg text-center"
                >
                  Find a Ride
                </Link>
                <Link
                  to="/register?type=driver"
                  className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 text-center"
                >
                  Offer a Ride
                </Link>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/taxi.jpg"
                  alt="Yellow taxi with passengers"
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* Floating Card */}
              {/* <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl border-l-4 border-yellow-500">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mumbai → Pune</div>
                    <div className="text-gray-500">Today, 2:00 PM</div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-yellow-600">₹450</span>
                      <span className="text-gray-500 text-sm ml-1">per seat</span>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SmartRide?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of ride-sharing with our comprehensive platform designed for safety, convenience, and affordability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Verified Drivers</h3>
              <p className="text-gray-600">
                All drivers are verified with valid licenses and vehicle documents for your safety.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Payments</h3>
              <p className="text-gray-600">
                Safe and secure payment processing with multiple payment options available.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Matching</h3>
              <p className="text-gray-600">
                Advanced algorithm matches you with rides based on your route and preferences.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Tracking</h3>
              <p className="text-gray-600">
                Track your ride in real-time and get updates on your journey progress.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User Reviews</h3>
              <p className="text-gray-600">
                Rate and review your travel experience to help build a trusted community.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Briefcase className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Flexible Booking</h3>
              <p className="text-gray-600">
                Book rides instantly or schedule them in advance for your convenience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How SmartRide Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with SmartRide is simple. Follow these easy steps to begin your ride-sharing journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Users className="h-10 w-10 text-yellow-600" />
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  01
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-600">
                Create your account as a driver or passenger in just a few minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <MapPin className="h-10 w-10 text-yellow-600" />
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  02
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Find or Post</h3>
              <p className="text-gray-600">
                Search for available rides or post your own trip with available seats.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Shield className="h-10 w-10 text-yellow-600" />
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  03
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect</h3>
              <p className="text-gray-600">
                Get matched with compatible travelers and confirm your booking.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Briefcase className="h-10 w-10 text-yellow-600" />
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  04
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Travel</h3>
              <p className="text-gray-600">
                Enjoy your shared journey with real-time tracking and secure payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who are already saving money and reducing their carbon footprint.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?type=passenger"
              className="bg-white text-yellow-600 hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-lg"
            >
              Sign Up as Passenger
            </Link>
            <Link
              to="/register?type=driver"
              className="border-2 border-white text-white hover:bg-white hover:text-yellow-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200"
            >
              Sign Up as Driver
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage