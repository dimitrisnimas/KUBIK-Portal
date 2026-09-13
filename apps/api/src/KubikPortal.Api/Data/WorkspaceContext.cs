namespace KubikPortal.Api.Data;

public interface IWorkspaceContext
{
    Guid? WorkspaceId { get; }
    Guid? PersonaId { get; }
}

public sealed class WorkspaceContext : IWorkspaceContext
{
    public Guid? WorkspaceId { get; private set; }
    public Guid? PersonaId { get; private set; }

    public void Set(Guid workspaceId, Guid personaId)
    {
        WorkspaceId = workspaceId;
        PersonaId = personaId;
    }
}
