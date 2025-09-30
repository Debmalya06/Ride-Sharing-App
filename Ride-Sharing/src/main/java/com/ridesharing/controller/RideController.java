package com.ridesharing.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ridesharing.dto.ApiResponse;
import com.ridesharing.dto.BookingResponseDto;
import com.ridesharing.dto.RidePostDto;
import com.ridesharing.dto.RideResponseDto;
import com.ridesharing.dto.RideSearchDto;
import com.ridesharing.entity.RideStatus;
import com.ridesharing.security.JwtTokenProvider;
import com.ridesharing.service.BookingService;
import com.ridesharing.service.RideService;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;
    private final BookingService bookingService;
    private final JwtTokenProvider jwtTokenProvider;

    // Driver endpoints for posting and managing rides

    @PostMapping
    public ResponseEntity<ApiResponse> postRide(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody RidePostDto ridePostDto) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            RideResponseDto ride = rideService.postRide(phoneNumber, ridePostDto);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride posted successfully",
                ride
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while posting the ride",
                null
            ));
        }
    }

    @GetMapping("/my-rides")
    public ResponseEntity<ApiResponse> getMyRides(
            @RequestHeader("Authorization") String token) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            List<RideResponseDto> rides = rideService.getDriverRides(phoneNumber);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Rides retrieved successfully",
                rides
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while retrieving rides",
                null
            ));
        }
    }

    @GetMapping("/my-rides/upcoming")
    public ResponseEntity<ApiResponse> getMyUpcomingRides(
            @RequestHeader("Authorization") String token) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            List<RideResponseDto> rides = rideService.getUpcomingDriverRides(phoneNumber);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Upcoming rides retrieved successfully",
                rides
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while retrieving upcoming rides",
                null
            ));
        }
    }

    @PutMapping("/{rideId}/status")
    public ResponseEntity<ApiResponse> updateRideStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId,
            @RequestParam RideStatus status) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            RideResponseDto ride = rideService.updateRideStatus(phoneNumber, rideId, status);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride status updated successfully",
                ride
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while updating ride status",
                null
            ));
        }
    }

    @DeleteMapping("/{rideId}")
    public ResponseEntity<ApiResponse> deleteRide(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            rideService.deleteRide(phoneNumber, rideId);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride deleted successfully",
                null
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while deleting the ride",
                null
            ));
        }
    }

    @GetMapping("/{rideId}/bookings")
    public ResponseEntity<ApiResponse> getRideBookings(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            List<BookingResponseDto> bookings = bookingService.getRideBookings(phoneNumber, rideId);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride bookings retrieved successfully",
                bookings
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while retrieving ride bookings",
                null
            ));
        }
    }

    // Public endpoints for searching rides

    @PostMapping("/search")
    public ResponseEntity<ApiResponse> searchRides(@Valid @RequestBody RideSearchDto searchDto) {
        try {
            Page<RideResponseDto> rides = rideService.searchRides(searchDto);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Rides found successfully",
                rides
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while searching for rides",
                null
            ));
        }
    }

    // Enhanced ride management APIs
    @PutMapping("/{rideId}/cancel")
    public ResponseEntity<ApiResponse> cancelRide(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            RideResponseDto ride = rideService.updateRideStatus(phoneNumber, rideId, RideStatus.CANCELLED);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride cancelled successfully",
                ride
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        }
    }

    @PutMapping("/{rideId}/complete")
    public ResponseEntity<ApiResponse> completeRide(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            RideResponseDto ride = rideService.updateRideStatus(phoneNumber, rideId, RideStatus.COMPLETED);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride marked as completed",
                ride
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        }
    }

    @PutMapping("/{rideId}/activate")
    public ResponseEntity<ApiResponse> activateRide(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            RideResponseDto ride = rideService.updateRideStatus(phoneNumber, rideId, RideStatus.ACTIVE);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride activated successfully",
                ride
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        }
    }

    // Booking management APIs for drivers
    @PutMapping("/{rideId}/bookings/{bookingId}/confirm")
    public ResponseEntity<ApiResponse> confirmBooking(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId,
            @PathVariable Long bookingId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            BookingResponseDto booking = bookingService.confirmBookingByDriver(phoneNumber, rideId, bookingId);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Booking confirmed successfully",
                booking
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        }
    }

    @PutMapping("/{rideId}/bookings/{bookingId}/cancel")
    public ResponseEntity<ApiResponse> cancelBookingByDriver(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId,
            @PathVariable Long bookingId) {
        try {
            String phoneNumber = jwtTokenProvider.getUsernameFromToken(token.substring(7));
            BookingResponseDto booking = bookingService.cancelBookingByDriver(phoneNumber, rideId, bookingId);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Booking cancelled successfully",
                booking
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        }
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<ApiResponse> getRideById(@PathVariable Long rideId) {
        try {
            RideResponseDto ride = rideService.getRideById(rideId);
            
            return ResponseEntity.ok(new ApiResponse(
                "SUCCESS",
                "Ride details retrieved successfully",
                ride
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                "ERROR",
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(
                "ERROR",
                "An error occurred while retrieving ride details",
                null
            ));
        }
    }
}