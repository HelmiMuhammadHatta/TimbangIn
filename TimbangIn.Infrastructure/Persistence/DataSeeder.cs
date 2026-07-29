using Microsoft.EntityFrameworkCore;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Enums;

namespace TimbangIn.Infrastructure.Persistence
{
    public static class DataSeeder
    {
        public static async Task SeedDataAsync(AppDbContext context)
        {
            if (!await context.Users.AnyAsync())
            {
                context.Users.Add(new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = Role.Admin,
                    Email = "admin@timbangin.local"
                });
                context.Users.Add(new User
                {
                    Username = "operator",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Operator123!"),
                    Role = Role.Operator,
                    Email = "operator@timbangin.local"
                });
                await context.SaveChangesAsync();
            }

            if (!await context.Customers.AnyAsync())
            {
                var customers = new List<Customer>
                {
                    new Customer { Name = "PT. Bangun Perkasa", Address = "Jl. Sudirman 1", Phone = "08111222333" },
                    new Customer { Name = "CV. Maju Jaya", Address = "Jl. Thamrin 2", Phone = "08222333444" },
                    new Customer { Name = "UD. Sumber Rezeki", Address = "Jl. Gatot Subroto 3", Phone = "08333444555" }
                };
                context.Customers.AddRange(customers);
                await context.SaveChangesAsync();

                if (!await context.TruckMasters.AnyAsync())
                {
                    var truckMasters = new List<TruckMaster>
                    {
                        new TruckMaster { PlateNumber = "B 1234 CD", DriverName = "Budi", MaxCapacityKg = 10000, CustomerId = customers[0].Id },
                        new TruckMaster { PlateNumber = "B 5678 EF", DriverName = "Andi", MaxCapacityKg = 15000, CustomerId = customers[0].Id },
                        new TruckMaster { PlateNumber = "D 9012 GH", DriverName = "Cipto", MaxCapacityKg = 8000, CustomerId = customers[1].Id },
                        new TruckMaster { PlateNumber = "D 3456 IJ", DriverName = "Dodi", MaxCapacityKg = 12000, CustomerId = customers[1].Id },
                        new TruckMaster { PlateNumber = "L 7890 KL", DriverName = "Eko", MaxCapacityKg = 20000, CustomerId = customers[2].Id }
                    };
                    context.TruckMasters.AddRange(truckMasters);
                }
            }

            if (!await context.MaterialTypes.AnyAsync())
            {
                var materials = new List<MaterialType>
                {
                    new MaterialType { Name = "Pasir", Unit = "Ton" },
                    new MaterialType { Name = "Batu Split", Unit = "Ton" },
                    new MaterialType { Name = "Tanah Urug", Unit = "Ton" }
                };
                context.MaterialTypes.AddRange(materials);
            }

            if (!await context.Permissions.AnyAsync())
            {
                var permissionNames = new[]
                {
                    "customer.read", "customer.create", "customer.update", "customer.delete",
                    "truck.read", "truck.create", "truck.update", "truck.delete",
                    "material.read", "material.create", "material.update", "material.delete",
                    "transaction.read", "transaction.create", "transaction.update", "transaction.delete", "transaction.cancel"
                };

                var permissions = permissionNames.Select(name => new Permission { Name = name }).ToList();
                context.Permissions.AddRange(permissions);
                await context.SaveChangesAsync();

                var rolePermissions = new List<RolePermission>();

                // Admin gets all permissions
                foreach (var perm in permissions)
                {
                    rolePermissions.Add(new RolePermission { Role = Role.Admin, PermissionId = perm.Id });
                }

                // Operator gets limited permissions
                var operatorPerms = new[] { "customer.read", "truck.read", "material.read", "transaction.read", "transaction.create" };
                foreach (var perm in permissions.Where(p => operatorPerms.Contains(p.Name)))
                {
                    rolePermissions.Add(new RolePermission { Role = Role.Operator, PermissionId = perm.Id });
                }

                context.RolePermissions.AddRange(rolePermissions);
            }

            await context.SaveChangesAsync();
        }
    }
}
