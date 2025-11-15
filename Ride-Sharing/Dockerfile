FROM eclipse-temurin:21-jdk

WORKDIR /app

EXPOSE 8080

# Copy the built JAR file from the build context
# The docker build command runs from the project root, so we use Ride-Sharing/target/
COPY Ride-Sharing/target/*.jar app.jar

# Health check to monitor container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD java -cp app.jar -c "import java.net.URL; new URL(\"http://localhost:8080/api/test\").openConnection().getInputStream();" || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
