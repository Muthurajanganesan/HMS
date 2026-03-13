# Use an official Maven image to build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Set the working directory
WORKDIR /app

# Copy the pom.xml and download dependencies (for better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:17-jre

# Set the working directory
WORKDIR /app

# Copy the JAR file from the build stage
COPY --from=build /app/target/hospital-management-system-1.0.0.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the JAR file
ENTRYPOINT ["java", "-jar", "app.jar"]